import { Redis } from '@upstash/redis';

interface WhatsAppAutoResponseEvent {
  messageId: string;
  partnerId: string;
  fromNumber: string;
  partnerName: string;
  timestamp: string;
}

class RedisService {
  private redis: Redis;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    
    if (this.isEnabled) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    } else {
      console.warn('⚠️ Redis not configured - auto-responses disabled');
      // Create a mock redis object for development
      this.redis = {} as Redis;
    }
  }

  /**
   * Check if Redis is configured and available
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Publish WhatsApp auto-response event
   */
  async publishAutoResponseEvent(event: WhatsAppAutoResponseEvent): Promise<void> {
    if (!this.isEnabled) {
      console.log('🔕 Redis disabled - skipping auto-response event publication');
      return;
    }

    try {
      const channel = 'whatsapp:auto-response';
      const message = JSON.stringify(event);
      
      await this.redis.publish(channel, message);
      
      console.log(`✅ Published auto-response event to Redis:`, {
        channel,
        messageId: event.messageId,
        fromNumber: event.fromNumber,
        partnerName: event.partnerName
      });
    } catch (error) {
      console.error('❌ Failed to publish auto-response event to Redis:', error);
      // Don't throw - we don't want Redis failures to break webhook processing
    }
  }

  /**
   * Subscribe to auto-response events
   */
  async subscribeToAutoResponseEvents(callback: (event: WhatsAppAutoResponseEvent) => Promise<void>): Promise<void> {
    if (!this.isEnabled) {
      console.warn('⚠️ Redis disabled - cannot subscribe to events');
      return;
    }

    try {
      const channel = 'whatsapp:auto-response';
      
      // Note: For serverless environments, we'll use a different approach
      // This method is more suitable for long-running processes
      console.log(`🔊 Subscribing to Redis channel: ${channel}`);
      
      // For now, this is a placeholder for the subscription logic
      // In serverless environments, we'll use a pull-based approach instead
      
    } catch (error) {
      console.error('❌ Failed to subscribe to Redis events:', error);
      throw error;
    }
  }

  /**
   * Get pending auto-response events (for serverless processing)
   * Enhanced with better error handling and safe queue management
   */
  async getPendingAutoResponseEvents(limit: number = 10): Promise<WhatsAppAutoResponseEvent[]> {
    if (!this.isEnabled) {
      return [];
    }

    try {
      const queueKey = 'whatsapp:auto-response:queue';
      
      console.log(`🔍 Checking Redis queue: ${queueKey}`);
      
      // First, check queue length
      const queueLength = await this.redis.llen(queueKey);
      console.log(`📊 Redis queue length: ${queueLength}`);
      
      if (queueLength === 0) {
        return [];
      }

      // Get events without removing them first (safer approach)
      const rawEvents = await this.redis.lrange(queueKey, 0, limit - 1);
      console.log(`📨 Retrieved ${rawEvents.length} raw events from Redis`);
      
      if (rawEvents.length === 0) {
        return [];
      }

      // Parse events and collect successfully parsed ones
      const parsedEvents: WhatsAppAutoResponseEvent[] = [];
      const failedIndices: number[] = [];

      rawEvents.forEach((eventData, index) => {
        try {
          let parsedEvent: WhatsAppAutoResponseEvent;
          
          console.log(`🔍 Processing Redis event ${index}:`, {
            type: typeof eventData,
            isString: typeof eventData === 'string',
            isObject: typeof eventData === 'object',
            preview: typeof eventData === 'string' ? eventData.substring(0, 100) + '...' : '[object]'
          });

          // Handle both string and object formats
          if (typeof eventData === 'string') {
            parsedEvent = JSON.parse(eventData);
          } else if (typeof eventData === 'object' && eventData !== null) {
            // Already parsed object
            parsedEvent = eventData as WhatsAppAutoResponseEvent;
          } else {
            console.warn(`⚠️ Invalid Redis event format at index ${index}:`, typeof eventData);
            failedIndices.push(index);
            return;
          }

          // Validate required fields
          if (!parsedEvent.messageId || !parsedEvent.partnerId || !parsedEvent.fromNumber) {
            console.warn(`⚠️ Missing required fields in event ${index}:`, parsedEvent);
            failedIndices.push(index);
            return;
          }

          parsedEvents.push(parsedEvent);
          console.log(`✅ Successfully parsed event ${index}:`, {
            messageId: parsedEvent.messageId.substring(0, 20) + '...',
            partnerId: parsedEvent.partnerId.substring(0, 8) + '...',
            fromNumber: parsedEvent.fromNumber.replace(/\d(?=\d{4})/g, '*'),
            partnerName: parsedEvent.partnerName
          });
          
        } catch (error) {
          console.error(`❌ Failed to parse Redis event at index ${index}:`, eventData, error);
          failedIndices.push(index);
        }
      });

      // Only remove events that were successfully parsed
      if (parsedEvents.length > 0) {
        try {
          // Remove the successfully processed events from the front of the queue
          await this.redis.ltrim(queueKey, parsedEvents.length, -1);
          console.log(`✂️ Removed ${parsedEvents.length} processed events from Redis queue`);
        } catch (trimError) {
          console.error('❌ Failed to trim Redis queue:', trimError);
          // Don't fail the whole operation if trim fails
        }
      }

      // Handle failed parsing by moving those events to a failed queue
      if (failedIndices.length > 0) {
        console.warn(`⚠️ ${failedIndices.length} events failed to parse - moving to failed queue`);
        try {
          // Move failed events to a separate queue for manual inspection
          const failedQueueKey = 'whatsapp:auto-response:failed';
          const failedEvents = failedIndices.map(i => rawEvents[i]);
          
          for (const failedEvent of failedEvents) {
            await this.redis.lpush(failedQueueKey, JSON.stringify({
              originalEvent: failedEvent,
              failedAt: new Date().toISOString(),
              reason: 'PARSE_ERROR'
            }));
          }
          
          console.log(`📝 Moved ${failedIndices.length} failed events to failed queue`);
        } catch (failedQueueError) {
          console.error('❌ Failed to store failed events:', failedQueueError);
        }
      }

      console.log(`🎉 Successfully processed ${parsedEvents.length}/${rawEvents.length} Redis events`);
      return parsedEvents;
      
    } catch (error) {
      console.error('❌ Failed to get pending auto-response events from Redis:', error);
      return [];
    }
  }

  /**
   * Queue auto-response event (serverless-friendly approach)
   */
  async queueAutoResponseEvent(event: WhatsAppAutoResponseEvent): Promise<void> {
    if (!this.isEnabled) {
      console.log('🔕 Redis disabled - skipping auto-response event queuing');
      return;
    }

    try {
      const queueKey = 'whatsapp:auto-response:queue';
      const message = JSON.stringify(event);
      
      await this.redis.lpush(queueKey, message);
      
      console.log(`✅ Queued auto-response event in Redis:`, {
        messageId: event.messageId,
        fromNumber: event.fromNumber,
        partnerName: event.partnerName
      });
    } catch (error) {
      console.error('❌ Failed to queue auto-response event in Redis:', error);
      // Don't throw - we don't want Redis failures to break webhook processing
    }
  }

  /**
   * Store failed auto-response for retry
   */
  async storFailedAutoResponse(event: WhatsAppAutoResponseEvent, error: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const failedKey = 'whatsapp:auto-response:failed';
      const failedEvent = {
        ...event,
        failedAt: new Date().toISOString(),
        error
      };
      
      await this.redis.lpush(failedKey, JSON.stringify(failedEvent));
      
      console.log(`📝 Stored failed auto-response for retry:`, {
        messageId: event.messageId,
        error
      });
    } catch (redisError) {
      console.error('❌ Failed to store failed auto-response:', redisError);
    }
  }

  /**
   * Check if message was recently processed (deduplication) - DISABLED
   * @deprecated Spam prevention has been disabled
   */
  async wasRecentlyProcessed(fromNumber: string, partnerId: string, windowMinutes: number = 5): Promise<boolean> {
    // SPAM PREVENTION DISABLED - Always return false to allow all messages
    console.log(`✅ Spam prevention disabled - allowing all messages`);
    return false;
  }

  /**
   * Check if specific message ID was already processed (prevents duplicate processing)
   */
  async wasMessageAlreadyProcessed(messageId: string, windowMinutes: number = 10): Promise<boolean> {
    console.log(`🔧 REDIS DEBUG: wasMessageAlreadyProcessed called`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Window: ${windowMinutes} minutes`);
    console.log(`   Redis enabled: ${this.isEnabled}`);
    
    if (!this.isEnabled) {
      console.log(`🔕 REDIS DISABLED - cannot check if message was processed`);
      console.log(`   This means NO duplicate prevention is working!`);
      return false;
    }

    try {
      const processedKey = `whatsapp:processed:${messageId}`;
      console.log(`🔍 REDIS QUERY: Checking for key: ${processedKey}`);
      
      const exists = await this.redis.exists(processedKey);
      console.log(`📊 REDIS RESPONSE: Key exists = ${exists}`);
      
      if (!exists) {
        // Mark message as processed with expiration
        const ttlSeconds = windowMinutes * 60;
        console.log(`✅ NEW MESSAGE: Not in Redis - marking as processed`);
        console.log(`   Setting TTL: ${ttlSeconds} seconds (${windowMinutes} minutes)`);
        
        await this.redis.setex(processedKey, ttlSeconds, new Date().toISOString());
        
        console.log(`📝 REDIS STORED: Message marked as processed with expiration`);
        return false;
      }
      
      // Get the stored timestamp for debugging
      const storedValue = await this.redis.get(processedKey);
      console.log(`⚠️ DUPLICATE FOUND: Message already in Redis`);
      console.log(`   Key: ${processedKey}`);
      console.log(`   Stored at: ${storedValue}`);
      console.log(`   Window: Last ${windowMinutes} minutes`);
      console.log(`🚫 BLOCKING: This auto-response will be prevented`);
      return true;
    } catch (error) {
      console.error('❌ REDIS ERROR: Failed to check message processing status');
      console.error(`   Error type: ${error instanceof Error ? error.name : typeof error}`);
      console.error(`   Error message: ${error instanceof Error ? error.message : error}`);
      console.error(`   Failing safely - allowing processing to continue`);
      // On error, allow processing to continue (fail-safe)
      return false;
    }
  }

  /**
   * Clean up old processed messages from Redis cache
   */
  async cleanupOldProcessedMessages(minutesOld: number = 30): Promise<number> {
    if (!this.isEnabled) return 0;

    try {
      const pattern = 'processed:*';
      const cutoffTime = Date.now() - (minutesOld * 60 * 1000);
      let cleanedCount = 0;

      // Get all processed message keys
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        try {
          // Get the timestamp from the key value
          const timestamp = await this.redis.get(key);
          
          if (timestamp && parseInt(timestamp as string) < cutoffTime) {
            await this.redis.del(key);
            cleanedCount++;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to cleanup key ${key}:`, error);
        }
      }

      console.log(`🗑️ Cleaned up ${cleanedCount} old processed message keys`);
      return cleanedCount;
    } catch (error) {
      console.error('❌ Redis cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Create response lock for phone number (prevents multiple auto-responses)
   * Uses atomic SET with NX (only set if not exists) and EX (expiration)
   */
  async createResponseLock(fromNumber: string, partnerId: string, windowMinutes: number = 5): Promise<boolean> {
    console.log(`🔒 RESPONSE LOCK: Attempting to create lock for ${fromNumber}`);
    
    if (!this.isEnabled) {
      console.log(`🔕 Redis disabled - cannot create response lock`);
      console.log(`   WARNING: Without Redis, multiple responses may be sent!`);
      return true; // Allow processing when Redis is disabled
    }

    try {
      const lockKey = `whatsapp:response-lock:${fromNumber}:${partnerId}`;
      const ttlSeconds = windowMinutes * 60;
      const lockValue = new Date().toISOString();
      
      console.log(`🔍 LOCK CHECK: Key: ${lockKey}`);
      console.log(`   TTL: ${ttlSeconds} seconds (${windowMinutes} minutes)`);
      
      // Atomic operation: SET key value NX EX ttl
      // Returns "OK" if key was set (didn't exist), null if key already exists
      const result = await this.redis.set(lockKey, lockValue, { nx: true, ex: ttlSeconds });
      
      if (result === 'OK') {
        console.log(`✅ LOCK CREATED: Response lock acquired for ${fromNumber}`);
        console.log(`   Lock value: ${lockValue}`);
        console.log(`   Expires in: ${windowMinutes} minutes`);
        return true; // Lock created successfully
      } else {
        console.log(`🚫 LOCK EXISTS: Response lock already exists for ${fromNumber}`);
        
        // Get existing lock info for debugging
        const existingValue = await this.redis.get(lockKey);
        const ttl = await this.redis.ttl(lockKey);
        
        console.log(`   Existing lock created: ${existingValue}`);
        console.log(`   Lock expires in: ${ttl} seconds`);
        console.log(`🚫 AUTO-RESPONSE BLOCKED: Recent response already sent/processing`);
        return false; // Lock already exists
      }
    } catch (error) {
      console.error('❌ LOCK ERROR: Failed to create response lock');
      console.error(`   Error type: ${error instanceof Error ? error.name : typeof error}`);
      console.error(`   Error message: ${error instanceof Error ? error.message : error}`);
      console.error(`   Failing safely - allowing processing to continue`);
      return true; // On error, allow processing (fail-safe)
    }
  }

  /**
   * Check if response lock exists for phone number
   */
  async hasResponseLock(fromNumber: string, partnerId: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const lockKey = `whatsapp:response-lock:${fromNumber}:${partnerId}`;
      const exists = await this.redis.exists(lockKey);
      
      console.log(`🔍 LOCK CHECK: ${lockKey} exists = ${exists}`);
      return exists === 1;
    } catch (error) {
      console.error('❌ Failed to check response lock:', error);
      return false; // On error, assume no lock (fail-safe)
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
      return false;
    }
  }
}

export default new RedisService();
export type { WhatsAppAutoResponseEvent };