import { app, initDatabase } from './app';
import { prisma } from './prisma';

const PORT = process.env.PORT || 3001;

// Start server (for local development)
async function startServer() {
  try {
    // Log environment variables during startup
    console.log('🔧 Environment Configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);

    console.log(`   BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN}`);
    console.log(`   BLOB_BASE_URL: ${process.env.BLOB_BASE_URL}`);



    if (process.env.DATABASE_URL) {
      // Show only the host part for security
      const dbUrl = new URL(process.env.DATABASE_URL);
      console.log(`   Database Host: ${dbUrl.hostname}`);
      console.log(`   Database Name: ${dbUrl.pathname.slice(1)}`);
    }
    console.log('');

    // Connect to database
    await initDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();