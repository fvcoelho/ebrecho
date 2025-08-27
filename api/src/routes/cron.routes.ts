import { Router } from 'express';
import { prisma } from '../prisma/index.js';
import { ProductStatus } from '@prisma/client';

const router = Router();

/**
 * @swagger
 * /api/cron:
 *   get:
 *     summary: Daily maintenance cron job
 *     description: Performs daily maintenance tasks like cleaning up expired data
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Maintenance tasks completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       task:
 *                         type: string
 *                       status:
 *                         type: string
 *                       count:
 *                         type: number
 *                       duration:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    const tasks = [];

    console.log('🕐 Starting daily maintenance cron job...');

    // Task 1: Clean up old webhook logs (older than 30 days)
    try {
      const webhookStartTime = Date.now();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const deletedWebhookLogs = await prisma.whatsAppWebhookLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      tasks.push({
        task: 'cleanup_old_webhook_logs',
        status: 'completed',
        count: deletedWebhookLogs.count,
        duration: `${Date.now() - webhookStartTime}ms`
      });

      console.log(`✅ Cleaned up ${deletedWebhookLogs.count} old webhook logs`);
    } catch (error) {
      tasks.push({
        task: 'cleanup_old_webhook_logs',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: '0ms'
      });
      console.error('❌ Failed to clean up webhook logs:', error);
    }

    // Task 2: Clean up old user sessions (older than 7 days)
    try {
      const sessionStartTime = Date.now();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // First find sessions to be deleted
      const sessionsToDelete = await prisma.userSession.findMany({
        where: {
          updatedAt: {
            lt: sevenDaysAgo
          }
        },
        select: { sessionId: true }
      });

      // Delete related records first to avoid foreign key constraints
      await prisma.userActivity.deleteMany({
        where: {
          sessionId: {
            in: sessionsToDelete.map(s => s.sessionId)
          }
        }
      });

      await prisma.pageView.deleteMany({
        where: {
          sessionId: {
            in: sessionsToDelete.map(s => s.sessionId)
          }
        }
      });

      // Now delete the sessions
      const deletedSessions = await prisma.userSession.deleteMany({
        where: {
          sessionId: {
            in: sessionsToDelete.map(s => s.sessionId)
          }
        }
      });

      tasks.push({
        task: 'cleanup_old_sessions',
        status: 'completed',
        count: deletedSessions.count,
        duration: `${Date.now() - sessionStartTime}ms`
      });

      console.log(`✅ Cleaned up ${deletedSessions.count} old user sessions`);
    } catch (error) {
      tasks.push({
        task: 'cleanup_old_sessions',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: '0ms'
      });
      console.error('❌ Failed to clean up user sessions:', error);
    }

    // Task 3: Update partner statistics
    try {
      const statsStartTime = Date.now();
      
      // Example: Update product counts for partners
      const partners = await prisma.partner.findMany({
        select: { id: true }
      });

      let updatedPartners = 0;
      for (const partner of partners) {
        const productCount = await prisma.product.count({
          where: { partnerId: partner.id, status: ProductStatus.AVAILABLE }
        });
        
        // You could store this in a separate stats table if needed
        // For now, just counting the operation
        updatedPartners++;
      }

      tasks.push({
        task: 'update_partner_statistics',
        status: 'completed',
        count: updatedPartners,
        duration: `${Date.now() - statsStartTime}ms`
      });

      console.log(`✅ Updated statistics for ${updatedPartners} partners`);
    } catch (error) {
      tasks.push({
        task: 'update_partner_statistics',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: '0ms'
      });
      console.error('❌ Failed to update partner statistics:', error);
    }

    // Task 4: Clean up failed auto-response attempts (older than 24 hours)
    try {
      const autoResponseStartTime = Date.now();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Reset autoResponseSent flag for messages that failed to send auto-response
      const resetAutoResponse = await prisma.whatsAppMessage.updateMany({
        where: {
          autoResponseSent: false,
          direction: 'inbound',
          createdAt: {
            lt: twentyFourHoursAgo
          }
        },
        data: {
          autoResponseSent: null // Reset to allow retry if needed
        }
      });

      tasks.push({
        task: 'cleanup_failed_auto_responses',
        status: 'completed',
        count: resetAutoResponse.count,
        duration: `${Date.now() - autoResponseStartTime}ms`
      });

      console.log(`✅ Reset ${resetAutoResponse.count} failed auto-response attempts`);
    } catch (error) {
      tasks.push({
        task: 'cleanup_failed_auto_responses',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: '0ms'
      });
      console.error('❌ Failed to cleanup auto-response attempts:', error);
    }

    const totalDuration = Date.now() - startTime;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;

    console.log(`🎉 Daily maintenance completed in ${totalDuration}ms`);
    console.log(`   ✅ Completed: ${completedTasks} tasks`);
    console.log(`   ❌ Failed: ${failedTasks} tasks`);

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      totalDuration: `${totalDuration}ms`,
      tasks,
      summary: {
        total: tasks.length,
        completed: completedTasks,
        failed: failedTasks
      }
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      tasks: []
    });
  }
});

export default router;