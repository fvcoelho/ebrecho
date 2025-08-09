import { VercelRequest, VercelResponse } from '@vercel/node';

let appInitialized = false;
let expressApp: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle OPTIONS preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Lazy load and cache the Express app
    if (!appInitialized) {
      const module = await import('../src/app');
      expressApp = module.app;
      
      // Initialize database connection with retry logic
      const { initDatabase } = module;
      let retries = 3;
      while (retries > 0) {
        try {
          await initDatabase();
          console.log('Database initialized successfully');
          break;
        } catch (error) {
          retries--;
          console.error(`Failed to initialize database (${3 - retries}/3):`, error);
          if (retries === 0) {
            console.error('Database initialization failed after 3 attempts');
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      appInitialized = true;
    }

    // Forward the request to Express with timeout handling
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({ 
            error: 'Gateway Timeout', 
            message: 'Request processing took too long' 
          });
        }
        resolve(undefined);
      }, 29000); // Set timeout to 29 seconds (Vercel limit is 30)

      expressApp(req as any, res as any, (err: any) => {
        clearTimeout(timeout);
        if (err) {
          console.error('Express app error:', err);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Internal server error', 
              message: err.message 
            });
          }
        }
        resolve(undefined);
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Handler initialization failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}