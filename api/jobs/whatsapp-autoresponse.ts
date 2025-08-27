import { NextRequest } from 'next/server';
import AutoResponseService from '../src/services/auto-response.service';
import RedisService from '../src/services/redis.service';

/**
 * Vercel serverless function for processing WhatsApp auto-response events
 * 
 * This function can be triggered:
 * 1. Via webhook/HTTP request for manual processing
 * 2. Via Vercel Cron Jobs for scheduled processing
 * 
 * Environment: Serverless (Vercel)
 * Path: /api/jobs/whatsapp-autoresponse
 */

export default async function handler(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting WhatsApp auto-response processing job');

    // Optional: Verify authorization token for security
    const authToken = req.headers.get('authorization');
    const expectedToken = process.env.AUTO_RESPONSE_JOB_TOKEN;
    
    if (expectedToken && authToken !== `Bearer ${expectedToken}`) {
      console.log('❌ Unauthorized job request');
      return Response.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Check service health before processing
    const health = await AutoResponseService.healthCheck();
    if (!health.database) {
      console.error('❌ Database health check failed');
      return Response.json(
        { error: 'Database unavailable', health }, 
        { status: 503 }
      );
    }

    if (!health.redis) {
      console.warn('⚠️ Redis health check failed - using database fallback');
    }

    // Process all pending auto-responses
    const results = await AutoResponseService.processAllPending();
    const duration = Date.now() - startTime;

    console.log(`✅ Auto-response job completed in ${duration}ms:`, results);

    // Return success response with metrics
    return Response.json({
      success: true,
      processed: results.processed,
      failed: results.failed,
      duration: `${duration}ms`,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Auto-response job failed after ${duration}ms:`, error);

    // Return error response
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Configuration for Vercel Runtime
 * 
 * - maxDuration: 60 seconds (enough for batch processing)
 * - runtime: nodejs20.x (latest supported)
 */
export const config = {
  maxDuration: 60,
  runtime: 'nodejs20.x'
};