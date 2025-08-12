import { Router, Request, Response } from 'express';
import { put, list } from '@vercel/blob';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/test-blob/test-connection:
 *   get:
 *     summary: Test Vercel Blob connection
 *     description: Tests the connection to Vercel Blob storage and configuration
 *     tags: [Test Blob]
 *     responses:
 *       200:
 *         description: Blob connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Blob connection successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     testFile:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           format: uri
 *                         pathname:
 *                           type: string
 *                         size:
 *                           type: integer
 *                     config:
 *                       type: object
 *                       properties:
 *                         storeId:
 *                           type: string
 *                         baseUrl:
 *                           type: string
 *                         tokenLength:
 *                           type: integer
 *       500:
 *         description: Blob connection failed or configuration missing
 */
// Test Blob connection
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    logger.info('Testing Vercel Blob connection');

    // Test environment variables
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const storeId = process.env.BLOB_STORE_ID;
    const baseUrl = process.env.BLOB_BASE_URL;

    if (!token || !storeId || !baseUrl) {
      return res.status(500).json({
        success: false,
        error: 'Missing Blob configuration',
        config: {
          hasToken: !!token,
          storeId,
          baseUrl
        }
      });
    }

    // Test creating a simple text file
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testBlob = await put('test/connection-test.txt', testContent, {
      access: 'public',
      contentType: 'text/plain'
    });

    logger.info('Blob connection test successful', {
      url: testBlob.url,
      pathname: testBlob.pathname
    });

    return res.status(200).json({
      success: true,
      message: 'Blob connection successful',
      data: {
        testFile: {
          url: testBlob.url,
          pathname: testBlob.pathname,
          size: testContent.length
        },
        config: {
          storeId,
          baseUrl,
          tokenLength: token.length
        }
      }
    });

  } catch (error) {
    logger.error('Blob connection test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Blob connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/test-blob/list-blobs:
 *   get:
 *     summary: List blobs in storage
 *     description: Lists all blobs in Vercel Blob storage with optional prefix filter
 *     tags: [Test Blob]
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Filter blobs by pathname prefix
 *         example: "thumbnails/"
 *     responses:
 *       200:
 *         description: Blobs listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     blobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                             format: uri
 *                           pathname:
 *                             type: string
 *                           size:
 *                             type: integer
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                     hasMore:
 *                       type: boolean
 *                     cursor:
 *                       type: string
 *       500:
 *         description: Failed to list blobs
 */
// List blobs (for debugging)
router.get('/list-blobs', async (req: Request, res: Response) => {
  try {
    const { prefix } = req.query;
    
    logger.info('Listing blobs', { prefix });

    const result = await list({
      prefix: prefix as string || undefined,
      limit: 20
    });

    return res.status(200).json({
      success: true,
      data: {
        blobs: result.blobs.map(blob => ({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt
        })),
        hasMore: result.hasMore,
        cursor: result.cursor
      }
    });

  } catch (error) {
    logger.error('Error listing blobs:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to list blobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;