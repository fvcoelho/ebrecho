import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/prisma';

// Pre-initialize Prisma Client outside the handler
// This helps with cold starts in serverless
const initPrisma = async () => {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
};

// Initialize on cold start
let expressApp: any = null;
let isInitialized = false;

// Pre-load the Express app module
const loadApp = async () => {
  if (!expressApp) {
    const module = await import('../src/app');
    expressApp = module.app;
  }
  return expressApp;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle OPTIONS preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Initialize on first request only
    if (!isInitialized) {
      // Load Express app and connect to database in parallel
      const [app, dbConnected] = await Promise.all([
        loadApp(),
        initPrisma()
      ]);
      
      if (!dbConnected) {
        // Try once more with a shorter timeout
        const retryConnected = await Promise.race([
          initPrisma(),
          new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000))
        ]);
        
        if (!retryConnected) {
          console.error('Database connection failed, proceeding anyway');
        }
      }
      
      expressApp = app;
      isInitialized = true;
    }

    // Set a hard timeout of 25 seconds (leaving 5 seconds buffer for Vercel's 30s limit)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 25000);
    });

    // Handle the request
    const requestPromise = new Promise((resolve) => {
      expressApp(req as any, res as any, (err: any) => {
        if (err) {
          console.error('Express error:', err);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Internal server error',
              message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
            });
          }
        }
        resolve(undefined);
      });
    });

    // Race between request completion and timeout
    await Promise.race([requestPromise, timeoutPromise]).catch((err) => {
      if (!res.headersSent) {
        res.status(504).json({ 
          error: 'Gateway Timeout',
          message: 'The request took too long to process. Please try again.'
        });
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Handler initialization failed',
        message: process.env.NODE_ENV === 'production' 
          ? 'Service temporarily unavailable' 
          : (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  }
}

// Warm up the function by pre-loading dependencies
if (process.env.VERCEL === '1') {
  loadApp().catch(console.error);
  initPrisma().catch(console.error);
}