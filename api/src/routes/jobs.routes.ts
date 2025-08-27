import { Router } from 'express';
import AutoResponseService from '../services/auto-response.service.js';

const router = Router();

/**
 * @swagger
 * /api/jobs/whatsapp-autoresponse:
 *   post:
 *     summary: Process WhatsApp auto-response queue
 *     description: Processes pending WhatsApp auto-response messages from Redis queue or database
 *     tags: [Jobs]
 *     security:
 *       - cronSecret: []
 *     responses:
 *       200:
 *         description: Auto-response job completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                 duration:
 *                   type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: number
 *                     failed:
 *                       type: number
 *       401:
 *         description: Unauthorized - invalid cron secret
 *       500:
 *         description: Internal server error
 */
router.post('/whatsapp-autoresponse', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🤖 Starting WhatsApp auto-response job...');

    // Optional: Verify cron secret for security
    const cronSecret = req.headers.authorization;
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Invalid cron secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Process pending auto-responses
    const result = await AutoResponseService.processAllPending();

    const duration = Date.now() - startTime;

    console.log(`✅ Auto-response job completed in ${duration}ms`);
    console.log(`   📨 Processed: ${result.processed} messages`);
    console.log(`   ✅ Sent: ${result.sent} responses`);
    console.log(`   ❌ Failed: ${result.failed} responses`);

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      stats: {
        processed: result.processed,
        sent: result.sent,
        failed: result.failed
      },
      details: result.details
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Auto-response job failed:', error);

    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        processed: 0,
        sent: 0,
        failed: 1
      },
      details: {
        redis: { attempted: 0, successful: 0, failed: 0, duration: '0ms' },
        database: { attempted: 0, successful: 0, failed: 0, duration: '0ms' },
        healthCheck: { redis: false, database: false },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    });
  }
});

/**
 * @swagger
 * /api/jobs/health:
 *   get:
 *     summary: Auto-response service health check
 *     description: Checks the health of auto-response dependencies (Redis and database)
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Health check results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     redis:
 *                       type: boolean
 *                     database:
 *                       type: boolean
 */
router.get('/health', async (req, res) => {
  try {
    const health = await AutoResponseService.healthCheck();
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      services: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        redis: false,
        database: false
      }
    });
  }
});

/**
 * @swagger
 * /api/jobs/redis-debug:
 *   get:
 *     summary: Debug Redis queue status
 *     description: Provides detailed information about Redis queues for debugging
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Redis queue status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                 queues:
 *                   type: object
 */
router.get('/redis-debug', async (req, res) => {
  try {
    const RedisService = (await import('../services/redis.service.js')).default;
    
    if (!RedisService.enabled) {
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Redis is disabled',
        queues: {}
      });
    }

    // Check various queue lengths
    const redis = (RedisService as any).redis;
    const mainQueueLength = await redis.llen('whatsapp:auto-response:queue');
    const failedQueueLength = await redis.llen('whatsapp:auto-response:failed');
    
    // Get sample data from queues (first few items without removing them)
    const mainQueueSample = mainQueueLength > 0 ? await redis.lrange('whatsapp:auto-response:queue', 0, 2) : [];
    const failedQueueSample = failedQueueLength > 0 ? await redis.lrange('whatsapp:auto-response:failed', 0, 2) : [];

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      queues: {
        main: {
          key: 'whatsapp:auto-response:queue',
          length: mainQueueLength,
          sample: mainQueueSample.map((item, index) => ({
            index,
            type: typeof item,
            preview: typeof item === 'string' ? item.substring(0, 200) + '...' : '[object]'
          }))
        },
        failed: {
          key: 'whatsapp:auto-response:failed',
          length: failedQueueLength,
          sample: failedQueueSample.map((item, index) => ({
            index,
            type: typeof item,
            preview: typeof item === 'string' ? item.substring(0, 200) + '...' : '[object]'
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      queues: {}
    });
  }
});

export default router;