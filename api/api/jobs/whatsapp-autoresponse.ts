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

import { VercelRequest, VercelResponse } from '@vercel/node';
import AutoResponseService from '../../src/services/auto-response.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  
  try {
    console.log('🤖 Starting WhatsApp auto-response job...');

    // Only allow POST requests and cron jobs
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

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

    return res.status(200).json({
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

    return res.status(500).json({
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
}

// Configure the runtime
export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // 1 minute timeout
};