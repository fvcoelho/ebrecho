import { prisma } from '../prisma';
import WhatsAppService from './whatsapp.service';
import RedisService, { WhatsAppAutoResponseEvent } from './redis.service';

interface GreetingTemplate {
  morning: string;
  afternoon: string;
  night: string;
}

class AutoResponseService {
  private readonly defaultTemplate: GreetingTemplate = {
    morning: "Bom dia! Aqui é {partnerName}. Como posso ajudá-lo hoje?",
    afternoon: "Boa tarde! Aqui é {partnerName}. Em que posso ser útil?",
    night: "Boa noite! Aqui é {partnerName}. Como posso te atender?"
  };

  /**
   * Generate time-based greeting message
   */
  private generateTimeBasedGreeting(partnerName: string, customTemplate?: string): string {
    const now = new Date();
    
    // Convert to Brazilian timezone (UTC-3)
    const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hour = brazilTime.getHours();
    
    let greeting: string;
    
    // Determine time-based greeting
    if (hour >= 6 && hour < 12) {
      // Morning: 6:00 - 11:59
      greeting = customTemplate?.includes('{morning}') 
        ? customTemplate.replace('{morning}', this.defaultTemplate.morning)
        : this.defaultTemplate.morning;
    } else if (hour >= 12 && hour < 18) {
      // Afternoon: 12:00 - 17:59
      greeting = customTemplate?.includes('{afternoon}')
        ? customTemplate.replace('{afternoon}', this.defaultTemplate.afternoon)
        : this.defaultTemplate.afternoon;
    } else {
      // Night: 18:00 - 5:59
      greeting = customTemplate?.includes('{night}')
        ? customTemplate.replace('{night}', this.defaultTemplate.night)
        : this.defaultTemplate.night;
    }

    // Replace partner name placeholder
    return greeting.replace('{partnerName}', partnerName);
  }

  /**
   * Process auto-response event
   */
  async processAutoResponseEvent(event: WhatsAppAutoResponseEvent): Promise<void> {
    try {
      console.log(`🤖 Processing auto-response for message ${event.messageId}`);
      console.log(`📋 Event Details:`, {
        messageId: event.messageId,
        partnerId: event.partnerId,
        fromNumber: event.fromNumber,
        partnerName: event.partnerName,
        timestamp: event.timestamp
      });

      // Atomic Processing Lock (prevents concurrent processing)
      console.log(`🔐 CONCURRENCY CONTROL: Acquiring processing lock...`);
      const lockAcquired = await RedisService.acquireProcessingLock(
        event.fromNumber,
        event.partnerId,
        2 // 2-second lock to serialize processing
      );

      if (!lockAcquired) {
        console.log(`⏳ LOCK BUSY: Another process is handling messages from ${event.fromNumber}`);
        console.log(`   Waiting 500ms for other process to complete...`);
        
        // Wait for the other process to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if our message was processed by the other instance
        const processedAfterWait = await RedisService.getProcessedMessages(
          event.fromNumber,
          event.partnerId
        );
        
        if (processedAfterWait.includes(event.messageId)) {
          console.log(`✅ MESSAGE HANDLED: Message ${event.messageId} was processed by another instance`);
          console.log(`🚫 AUTO-RESPONSE SKIPPED - HANDLED BY CONCURRENT PROCESS`);
          return;
        }
        
        console.log(`🔄 RETRYING: Message not yet processed, attempting to handle...`);
        // Continue processing if message wasn't handled
      }

      // Message Group Cache Check (prevents reprocessing same messages)
      console.log(`💾 MESSAGE CACHE CHECK: Getting processed message IDs...`);
      console.log(`   From number: ${event.fromNumber}`);
      console.log(`   Partner ID: ${event.partnerId}`);
      
      const processedMessageIds = await RedisService.getProcessedMessages(
        event.fromNumber,
        event.partnerId
      );
      
      console.log(`📋 Found ${processedMessageIds.length} already processed message IDs`);

      // Define time window for collecting recent messages (30 seconds for real-time grouping)
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

      // Get recent inbound messages from the same number (last 30 seconds)
      console.log(`🔍 Looking up recent messages from ${event.fromNumber} (last 30 seconds)...`);
      const allRecentMessages = await prisma.whatsAppMessage.findMany({
        where: { 
          partnerId: event.partnerId,
          fromNumber: event.fromNumber,
          direction: 'inbound',
          createdAt: {
            gte: thirtySecondsAgo
          }
        },
        select: {
          messageId: true,
          textContent: true,
          messageType: true,
          fromNumber: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Filter out already processed messages
      const unprocessedMessages = allRecentMessages.filter(msg => 
        !processedMessageIds.includes(msg.messageId)
      );

      console.log(`📊 Found ${allRecentMessages.length} recent messages, ${unprocessedMessages.length} unprocessed`);
      
      if (unprocessedMessages.length === 0) {
        console.log(`⏭️ NO NEW MESSAGES: All recent messages already processed`);
        console.log(`   Current message ${event.messageId} was already handled`);
        console.log(`🚫 AUTO-RESPONSE SKIPPED - NO NEW MESSAGES TO PROCESS`);
        return;
      }
      
      console.log(`✅ PROCESSING: ${unprocessedMessages.length} new messages in this group`);
      
      // Immediately cache these message IDs to prevent other processes from handling them
      const messageIdsToProcess = unprocessedMessages.map(msg => msg.messageId);
      console.log(`🔒 CLAIMING MESSAGES: Adding ${messageIdsToProcess.length} messages to cache immediately`);
      await RedisService.addProcessedMessages(
        event.fromNumber,
        event.partnerId,
        messageIdsToProcess,
        10 // 10 minute cache
      );
      console.log(`✅ MESSAGES CLAIMED: Other processes will now skip these messages`);
      
      // Find the current message in the unprocessed batch
      const originalMessage = unprocessedMessages.find(msg => msg.messageId === event.messageId);
      const recentMessages = unprocessedMessages; // Use unprocessed messages for response

      // Get partner configuration
      console.log(`🔍 Looking up partner configuration for ID: ${event.partnerId}`);
      const partner = await prisma.partner.findUnique({
        where: { id: event.partnerId },
        select: {
          id: true,
          name: true,
          whatsappName: true,
          autoResponseEnabled: true,
          customGreetingTemplate: true
        }
      });

      if (!partner) {
        console.error(`❌ PARTNER NOT FOUND: ${event.partnerId}`);
        console.error(`   Action: Cannot send auto-response without partner configuration`);
        return;
      }

      console.log(`✅ Partner found: ${partner.name} (${partner.id})`);
      console.log(`   Auto-response enabled: ${partner.autoResponseEnabled}`);
      console.log(`   WhatsApp name: ${partner.whatsappName || 'Not set'}`);
      console.log(`   Custom template: ${partner.customGreetingTemplate ? 'Yes' : 'No'}`);

      if (!partner.autoResponseEnabled) {
        console.log(`🔕 AUTO-RESPONSE DISABLED for partner: ${partner.name}`);
        console.log(`   Action: Skipping auto-response as per partner settings`);
        return;
      }

      // Generate greeting message with combined inbound references
      const partnerName = partner.whatsappName || partner.name;
      console.log(`📝 Generating combined greeting message...`);
      console.log(`   Partner display name: ${partnerName}`);
      console.log(`   Processing ${recentMessages.length} recent messages`);
      
      const baseGreeting = this.generateTimeBasedGreeting(
        partnerName, 
        partner.customGreetingTemplate || undefined
      );
      
      let greeting: string;
      
      if (recentMessages.length === 1) {
        // Single message - use original format
        const inboundContent = originalMessage?.textContent || 'sua mensagem';
        const shortMessageId = event.messageId.substring(event.messageId.length - 8);
        greeting = `Respondendo "${inboundContent}" referente (inbound Id ${shortMessageId})\n\n${baseGreeting}`;
      } else {
        // Multiple messages - combine them
        const messageRefs = recentMessages
          .filter(msg => msg.textContent) // Only include text messages
          .map((msg, index) => {
            const shortId = msg.messageId.substring(msg.messageId.length - 8);
            return `${index + 1}. "${msg.textContent}" (Id ${shortId})`;
          })
          .join('\n');
        
        greeting = `Respondendo suas ${recentMessages.length} mensagens recentes:\n\n${messageRefs}\n\n${baseGreeting}`;
        
        console.log(`📝 Combined ${recentMessages.length} messages into single response`);
      }
      
      console.log(`💬 Generated message: "${greeting}"`);
      console.log(`📤 Attempting to send WhatsApp message...`);
      console.log(`   To: ${event.fromNumber}`);
      console.log(`   Partner ID: ${event.partnerId}`);

      // Send greeting message
      let response;
      try {
        response = await WhatsAppService.sendTextMessage({
          to: event.fromNumber,
          message: greeting,
          partnerId: event.partnerId
        });
        console.log(`✅ WhatsApp API responded successfully`);
        console.log(`   Response Message ID: ${response.messageId}`);
      } catch (sendError) {
        console.error(`❌ WHATSAPP SEND FAILED:`, sendError);
        console.error(`   Error type: ${sendError instanceof Error ? sendError.name : 'Unknown'}`);
        console.error(`   Error message: ${sendError instanceof Error ? sendError.message : sendError}`);
        throw sendError;
      }

      // Update ALL recent messages to track auto-response
      console.log(`📝 Updating database to track auto-response for ${recentMessages.length} messages...`);
      const messageIds = recentMessages.map(msg => msg.messageId);
      
      const updateResult = await prisma.whatsAppMessage.updateMany({
        where: { 
          messageId: {
            in: messageIds
          },
          partnerId: event.partnerId
        },
        data: {
          autoResponseSent: true,
          autoResponseAt: new Date(),
          autoResponseMessageId: response.messageId
        }
      });

      console.log(`✅ Database updated: ${updateResult.count} records modified (covered ${recentMessages.length} recent messages)`);

      // Note: Message IDs were already cached at the beginning to prevent race conditions

      console.log(`🎉 AUTO-RESPONSE COMPLETED SUCCESSFULLY:`, {
        originalMessageId: event.messageId,
        responseMessageId: response.messageId,
        fromNumber: event.fromNumber,
        partnerName,
        processedMessageCount: recentMessages.length,
        greeting: greeting.substring(0, 100) + '...'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ AUTO-RESPONSE PROCESSING FAILED for message ${event.messageId}`);
      console.error(`   Error Type: ${error instanceof Error ? error.name : typeof error}`);
      console.error(`   Error Message: ${errorMessage}`);
      console.error(`   Event Details:`, {
        messageId: event.messageId,
        partnerId: event.partnerId,
        fromNumber: event.fromNumber,
        partnerName: event.partnerName
      });
      
      if (error instanceof Error && error.stack) {
        console.error(`   Stack Trace:`, error.stack.split('\n').slice(0, 3).join('\n'));
      }
      
      // Check if it's a token expiration error
      if (errorMessage.includes('access token') && (
          errorMessage.includes('expired') || 
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('invalid')
        )) {
        console.error('🔑 WhatsApp access token has expired or is invalid');
        
        // Mark the message as failed due to token issue (don't retry immediately)
        await prisma.whatsAppMessage.updateMany({
          where: { 
            messageId: event.messageId,
            partnerId: event.partnerId
          },
          data: {
            autoResponseSent: false
          }
        });
        
        // Store failed response with specific token error flag
        await RedisService.storFailedAutoResponse(event, 'EXPIRED_TOKEN: ' + errorMessage);
      } else {
        // Regular error - store for retry
        await RedisService.storFailedAutoResponse(event, errorMessage);
        
        // Mark as failed for potential retry later
        await prisma.whatsAppMessage.updateMany({
          where: { 
            messageId: event.messageId,
            partnerId: event.partnerId
          },
          data: {
            autoResponseSent: false
          }
        });
      }
      
      throw error;
    }
  }

  /**
   * Process multiple auto-response events (batch processing)
   */
  async processBatchAutoResponses(events: WhatsAppAutoResponseEvent[]): Promise<void> {
    console.log(`📦 Processing batch of ${events.length} auto-response events`);

    const results = await Promise.allSettled(
      events.map(event => this.processAutoResponseEvent(event))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`📊 Batch auto-response results: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      console.error(`❌ Some auto-responses failed:`, 
        results
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason)
      );
    }
  }

  /**
   * Queue auto-response for processing (called from webhook)
   */
  async queueAutoResponse(messageId: string, partnerId: string, fromNumber: string, partnerName: string): Promise<void> {
    const event: WhatsAppAutoResponseEvent = {
      messageId,
      partnerId,
      fromNumber,
      partnerName,
      timestamp: new Date().toISOString()
    };

    // Queue in Redis for serverless processing
    await RedisService.queueAutoResponseEvent(event);
  }

  /**
   * Get messages that need auto-responses (fallback for when Redis is not available)
   * Enhanced to exclude messages that recently failed due to token issues
   */
  async getPendingAutoResponses(limit: number = 10): Promise<WhatsAppAutoResponseEvent[]> {
    try {
      const pendingMessages = await prisma.whatsAppMessage.findMany({
        where: {
          direction: 'inbound',
          status: 'DELIVERED',
          autoResponseSent: null, // Not yet processed
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // Extended to 30 minutes for better coverage
          },
          // Exclude messages that failed recently (within last hour) to avoid spam
          NOT: {
            autoResponseSent: false,
            autoResponseAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Don't retry failures within last hour
            }
          }
        },
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              whatsappName: true,
              autoResponseEnabled: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: limit
      });

      return pendingMessages
        .filter(msg => msg.partner.autoResponseEnabled)
        .map(msg => ({
          messageId: msg.messageId,
          partnerId: msg.partnerId,
          fromNumber: msg.fromNumber,
          partnerName: msg.partner.whatsappName || msg.partner.name,
          timestamp: msg.createdAt.toISOString()
        }));
        
    } catch (error) {
      console.error('❌ Failed to get pending auto-responses from database:', error);
      return [];
    }
  }

  /**
   * Health check for auto-response service
   */
  async healthCheck(): Promise<{ redis: boolean; database: boolean }> {
    const redisHealth = await RedisService.healthCheck();
    
    let databaseHealth = false;
    try {
      await prisma.partner.findFirst({ take: 1 });
      databaseHealth = true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
    }

    return {
      redis: redisHealth,
      database: databaseHealth
    };
  }

  /**
   * Process all pending auto-responses (for serverless function)
   * Enhanced with detailed debugging and async processing tracking
   */
  async processAllPending(): Promise<{ 
    processed: number; 
    failed: number; 
    sent: number;
    details: {
      redis: { attempted: number; successful: number; failed: number; duration: string };
      database: { attempted: number; successful: number; failed: number; duration: string };
      healthCheck: { redis: boolean; database: boolean };
      errors: string[];
    }
  }> {
    const startTime = Date.now();
    const details = {
      redis: { attempted: 0, successful: 0, failed: 0, duration: '0ms' },
      database: { attempted: 0, successful: 0, failed: 0, duration: '0ms' },
      healthCheck: { redis: false, database: false },
      errors: [] as string[]
    };

    console.log('🤖 Starting processAllPending() with enhanced debugging...');

    try {
      // Perform health check first
      console.log('🔍 Performing health check...');
      const healthStartTime = Date.now();
      details.healthCheck = await this.healthCheck();
      console.log(`📊 Health check completed in ${Date.now() - healthStartTime}ms:`, details.healthCheck);

      // Phase 1: Process Redis queue events
      console.log('📋 Phase 1: Checking Redis queue...');
      const redisStartTime = Date.now();
      
      if (RedisService.enabled && details.healthCheck.redis) {
        try {
          console.log('🔄 Redis is enabled and healthy, fetching pending events...');
          const redisEvents = await RedisService.getPendingAutoResponseEvents(20);
          details.redis.attempted = redisEvents.length;
          
          console.log(`📨 Found ${redisEvents.length} events in Redis queue`);
          
          if (redisEvents.length > 0) {
            console.log('🚀 Processing Redis events:', redisEvents.map(e => ({
              messageId: e.messageId.substring(0, 8) + '...',
              partnerId: e.partnerId.substring(0, 8) + '...',
              fromNumber: e.fromNumber.replace(/\d(?=\d{4})/g, '*'),
              timestamp: e.timestamp
            })));

            const redisResults = await Promise.allSettled(
              redisEvents.map(async (event) => {
                console.log(`📤 Processing Redis event for message: ${event.messageId}`);
                return this.processAutoResponseEvent(event);
              })
            );

            details.redis.successful = redisResults.filter(r => r.status === 'fulfilled').length;
            details.redis.failed = redisResults.filter(r => r.status === 'rejected').length;

            // Log failures
            redisResults.forEach((result, index) => {
              if (result.status === 'rejected') {
                const error = `Redis event ${index}: ${result.reason}`;
                console.error('❌ Redis processing failed:', error);
                details.errors.push(error);
              }
            });

            console.log(`✅ Redis processing complete: ${details.redis.successful} successful, ${details.redis.failed} failed`);
          }
        } catch (redisError) {
          const errorMsg = `Redis processing error: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          details.errors.push(errorMsg);
        }
      } else {
        const reason = !RedisService.enabled ? 'Redis disabled' : 'Redis unhealthy';
        console.log(`⏭️ Skipping Redis processing: ${reason}`);
      }

      details.redis.duration = `${Date.now() - redisStartTime}ms`;

      // Phase 2: Process database fallback events
      console.log('📋 Phase 2: Checking database fallback...');
      const dbStartTime = Date.now();

      if (details.healthCheck.database) {
        try {
          console.log('🔄 Database is healthy, fetching pending messages...');
          const databaseEvents = await this.getPendingAutoResponses(15);
          details.database.attempted = databaseEvents.length;

          console.log(`📨 Found ${databaseEvents.length} pending messages in database`);

          if (databaseEvents.length > 0) {
            console.log('🚀 Processing database events:', databaseEvents.map(e => ({
              messageId: e.messageId.substring(0, 8) + '...',
              partnerId: e.partnerId.substring(0, 8) + '...',
              fromNumber: e.fromNumber.replace(/\d(?=\d{4})/g, '*'),
              partnerName: e.partnerName,
              timestamp: e.timestamp
            })));

            const dbResults = await Promise.allSettled(
              databaseEvents.map(async (event) => {
                console.log(`📤 Processing database event for message: ${event.messageId}`);
                return this.processAutoResponseEvent(event);
              })
            );

            details.database.successful = dbResults.filter(r => r.status === 'fulfilled').length;
            details.database.failed = dbResults.filter(r => r.status === 'rejected').length;

            // Log failures
            dbResults.forEach((result, index) => {
              if (result.status === 'rejected') {
                const error = `Database event ${index}: ${result.reason}`;
                console.error('❌ Database processing failed:', error);
                details.errors.push(error);
              }
            });

            console.log(`✅ Database processing complete: ${details.database.successful} successful, ${details.database.failed} failed`);
          }
        } catch (dbError) {
          const errorMsg = `Database processing error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
          console.error('❌', errorMsg);
          details.errors.push(errorMsg);
        }
      } else {
        console.log('⏭️ Skipping database processing: Database unhealthy');
      }

      details.database.duration = `${Date.now() - dbStartTime}ms`;

      // Calculate totals
      const totalProcessed = details.redis.attempted + details.database.attempted;
      const totalSent = details.redis.successful + details.database.successful;
      const totalFailed = details.redis.failed + details.database.failed;
      const totalDuration = Date.now() - startTime;

      // Check for token expiration errors
      const tokenErrors = details.errors.filter(error => 
        error.includes('EXPIRED_TOKEN') || error.includes('access token')
      );

      console.log(`🎉 processAllPending() completed in ${totalDuration}ms`);
      console.log(`📊 Summary:`);
      console.log(`   📨 Total attempted: ${totalProcessed}`);
      console.log(`   ✅ Successfully sent: ${totalSent}`);
      console.log(`   ❌ Failed: ${totalFailed}`);
      console.log(`   🔴 Errors: ${details.errors.length}`);
      
      if (tokenErrors.length > 0) {
        console.log(`   🔑 Token expiration errors: ${tokenErrors.length}`);
        console.error(`🚨 WhatsApp token needs renewal! Failed attempts due to expired token: ${tokenErrors.length}`);
      }

      if (totalProcessed === 0) {
        console.log(`✨ No pending auto-responses found to process`);
      }

      if (details.errors.length > 0) {
        console.log(`🚨 Errors encountered:`, details.errors);
      }

      // Async cleanup (don't await to not slow down response)
      this.performAsyncCleanup().catch(cleanupError => {
        console.error('⚠️ Async cleanup failed:', cleanupError);
      });

      return { 
        processed: totalProcessed, 
        failed: totalFailed,
        sent: totalSent,
        details 
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ processAllPending() failed after ${duration}ms:`, error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      details.errors.push(`Global error: ${errorMsg}`);
      
      return { 
        processed: 0, 
        failed: 1,
        sent: 0,
        details 
      };
    }
  }

  /**
   * Perform async cleanup tasks (non-blocking)
   */
  private async performAsyncCleanup(): Promise<void> {
    console.log('🧹 Starting async cleanup...');
    
    try {
      // Clean up old failed auto-response attempts (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const resetCount = await prisma.whatsAppMessage.updateMany({
        where: {
          autoResponseSent: false,
          direction: 'inbound',
          createdAt: {
            lt: oneHourAgo
          }
        },
        data: {
          autoResponseSent: null // Reset to allow retry
        }
      });

      if (resetCount.count > 0) {
        console.log(`🔄 Reset ${resetCount.count} old failed auto-response attempts`);
      }

      // Clear Redis cache of processed messages older than 30 minutes
      if (RedisService.enabled) {
        await RedisService.cleanupOldProcessedMessages(30);
        console.log('🗑️ Cleaned up old processed messages from Redis');
      }

      console.log('✅ Async cleanup completed');
    } catch (error) {
      console.error('❌ Async cleanup error:', error);
    }
  }
}

export default new AutoResponseService();