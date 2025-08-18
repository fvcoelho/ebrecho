import { Request, Response, NextFunction } from 'express';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { put, del, list } from '@vercel/blob';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import multer from 'multer';

// Ensure environment variables are loaded
dotenv.config();

// Environment-aware path helper
const getEnvironmentPrefix = (): string => {
  const env = process.env.NODE_ENV || 'development';
  return env.toLowerCase(); // development, production, staging, etc.
};

// Utility functions for organized blob paths
export const BlobPathUtils = {
  /**
   * Generate organized path for partner product images
   */
  createProductImagePath(partnerId: string, productId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const envPrefix = getEnvironmentPrefix();
    return `${envPrefix}/partners/${partnerId}/products/${productId}/images/${timestamp}-${sanitizedFilename}`;
  },

  /**
   * Generate temporary upload path for partner
   */
  createTempUploadPath(partnerId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const envPrefix = getEnvironmentPrefix();
    return `${envPrefix}/partners/${partnerId}/products/temp-${timestamp}/images/${timestamp}-${sanitizedFilename}`;
  },

  /**
   * Generate thumbnail path from image path
   */
  createThumbnailPath(imagePath: string): string {
    if (imagePath.includes('/images/')) {
      return imagePath.replace('/images/', '/thumbnails/').replace(/\.[^/.]+$/, '-thumb.jpg');
    }
    // Fallback for non-organized paths - include environment prefix
    const envPrefix = getEnvironmentPrefix();
    return `${envPrefix}/thumbnails/${imagePath.replace(/\.[^/.]+$/, '')}-thumb.jpg`;
  },

  /**
   * Generate test upload path
   */
  createTestPath(filename: string): string {
    const timestamp = Date.now();
    const envPrefix = getEnvironmentPrefix();
    return `${envPrefix}/testing/direct-upload/${timestamp}-${filename}`;
  },

  /**
   * Check if path is temporary
   */
  isTemporaryPath(pathname: string): boolean {
    return pathname.includes('/temp-');
  },

  /**
   * Convert temporary path to final product path
   */
  convertTempToProductPath(tempPath: string, productId: string): string {
    const filename = tempPath.split('/').pop() || 'unknown';
    const pathParts = tempPath.split('/');
    
    // Extract partnerId from temp path: environment/partners/partnerId/products/temp-*/images/filename
    if (pathParts.length >= 6 && pathParts[1] === 'partners') {
      const envPrefix = pathParts[0]; // Keep same environment as temp path
      const partnerId = pathParts[2];
      return `${envPrefix}/partners/${partnerId}/products/${productId}/images/${filename}`;
    }
    
    // Fallback with current environment
    const envPrefix = getEnvironmentPrefix();
    return `${envPrefix}/products/${productId}/images/${filename}`;
  },

  /**
   * Generate partner logo path
   */
  createPartnerLogoPath(partnerId: string, filename: string): string {
    const envPrefix = getEnvironmentPrefix();
    return `${envPrefix}/partners/${partnerId}/logo/${filename}`;
  }
};

/**
 * @swagger
 * /api/blob/test-connection:
 *   get:
 *     summary: Test Vercel Blob connection
 *     description: Tests if the Vercel Blob token is properly configured
 *     tags: [Blob Upload]
 *     responses:
 *       200:
 *         description: Connection test successful
 *       500:
 *         description: Connection test failed
 */
export const testBlobConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('Testing Vercel Blob connection...');
    
    // Test 1: Check environment variables
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const storeId = process.env.BLOB_STORE_ID;
    const baseUrl = process.env.BLOB_BASE_URL;
    
    if (!token || !storeId) {
      return res.status(500).json({
        success: false,
        error: 'Missing BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID in environment',
        config: { token: !!token, storeId: !!storeId, baseUrl: !!baseUrl }
      });
    }
    
    // Test 2: Try to list existing blobs (this will validate the token)
    try {
      const blobs = await list({ limit: 1 });
      logger.info('Blob connection test successful', { 
        tokenValid: true, 
        storeId,
        blobCount: blobs.blobs.length 
      });
      
      return res.status(200).json({
        success: true,
        message: 'Vercel Blob connection successful',
        config: {
          storeId,
          baseUrl,
          tokenConfigured: true,
          blobCount: blobs.blobs.length
        }
      });
    } catch (blobError: any) {
      logger.error('Blob connection test failed:', blobError);
      return res.status(500).json({
        success: false,
        error: 'Failed to connect to Vercel Blob',
        details: blobError.message,
        config: { token: !!token, storeId, baseUrl }
      });
    }
  } catch (error) {
    logger.error('Error testing blob connection:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/blob/upload-token:
 *   post:
 *     summary: Generate upload token for Vercel Blob direct upload
 *     description: Generates a secure token for client-side direct upload to Vercel Blob storage
 *     tags: [Blob Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to associate images with (optional for testing)
 *                 example: "clm123abc456def"
 *               fileCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Number of files to upload
 *                 example: 3
 *     responses:
 *       200:
 *         description: Upload token generated successfully
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
 *                     uploadUrl:
 *                       type: string
 *                       example: "/api/blob/client-upload"
 *                     maxFiles:
 *                       type: integer
 *                       example: 10
 *                     maxSize:
 *                       type: integer
 *                       example: 5242880
 *                     allowedContentTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["image/jpeg", "image/png", "image/webp"]
 *                     clientPayload:
 *                       type: string
 *                       description: Encrypted payload with user/product info
 *       403:
 *         description: User not associated with partner or access denied
 *       404:
 *         description: Product not found
 */
export const generateUploadToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, fileCount } = req.body;
    const userId = req.user!.id;
    const partnerId = req.user!.partnerId;

    logger.info('Generating upload token', {
      userId,
      partnerId,
      productId,
      fileCount
    });

    // Validate user has partner association
    if (!partnerId) {
      return res.status(403).json({
        success: false,
        error: 'User is not associated with a partner'
      });
    }

    // If productId provided, verify ownership
    if (productId) {
      const product = await prisma.product.findFirst({
        where: { 
          id: productId, 
          partnerId 
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found or access denied'
        });
      }
    }

    // Generate upload configuration
    const uploadConfig = {
      maxFiles: fileCount || 10,
      maxSize: 5 * 1024 * 1024, // 5MB per file
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
      clientPayload: JSON.stringify({
        userId,
        partnerId,
        productId,
        timestamp: new Date().toISOString()
      })
    };

    logger.info('Upload token generated successfully', {
      userId,
      partnerId,
      productId,
      config: uploadConfig
    });

    return res.status(200).json({
      success: true,
      data: {
        uploadUrl: '/api/blob/client-upload',
        ...uploadConfig
      }
    });
  } catch (error) {
    logger.error('Error generating upload token:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/blob/client-upload:
 *   post:
 *     summary: Handle client-side blob upload
 *     description: Internal endpoint called by Vercel Blob client during direct upload
 *     tags: [Blob Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Vercel Blob client upload body
 *     responses:
 *       200:
 *         description: Upload handled successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Unauthorized upload
 */
export const handleClientUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = req.body as HandleUploadBody;

    logger.info('Handling client upload request', {
      type: body.type,
      payload: body.payload,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      tokenPreview: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + '...'
    });

    // Parse the client payload to verify authorization
    let clientPayload;
    try {
      const payloadString = typeof body.payload === 'string' ? body.payload : '{}';
      clientPayload = JSON.parse(payloadString);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client payload'
      });
    }

    // Verify the upload is authorized (you might want to add more validation)
    if (!clientPayload.userId || !clientPayload.partnerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized upload attempt'
      });
    }

    // Check if token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.error('BLOB_READ_WRITE_TOKEN not configured');
      return res.status(500).json({
        success: false,
        error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN.'
      });
    }

    // Generate the actual upload token from Vercel Blob
    // The handleUpload function needs the token to be in the environment
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // You can modify the pathname or add additional validation here
        logger.info('Generating token for pathname', { 
          pathname,
          clientPayload,
          tokenConfigured: !!process.env.BLOB_READ_WRITE_TOKEN 
        });
        
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 5 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after successful upload
        logger.info('Upload completed', {
          url: blob.url,
          pathname: blob.pathname
        });

        try {
          // Parse client payload
          const payload = JSON.parse(tokenPayload || '{}');
          
          if (payload.productId) {
            // Save to database if product ID provided
            await prisma.productImage.create({
              data: {
                productId: payload.productId,
                originalUrl: blob.url,
                processedUrl: blob.url, // Will be updated after processing
                thumbnailUrl: blob.url, // Will be updated after thumbnail generation
                order: 0,
                metadata: {
                  blobId: blob.pathname,
                  uploadedAt: new Date().toISOString()
                }
              }
            });
          }
        } catch (dbError) {
          logger.error('Error saving to database:', dbError);
          // Don't fail the upload, just log the error
        }
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    logger.error('Error handling client upload:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/blob/upload-complete:
 *   post:
 *     summary: Process completed blob uploads
 *     description: Processes uploaded images, generates thumbnails, and saves to database
 *     tags: [Blob Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - blobs
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to associate images with
 *                 example: "clm123abc456def"
 *               blobs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                       example: "https://hfnamd3s2wspxafm.public.blob.vercel-storage.com/image.jpg"
 *                     pathname:
 *                       type: string
 *                       example: "image.jpg"
 *                     size:
 *                       type: integer
 *                       example: 1024000
 *     responses:
 *       200:
 *         description: Upload completion processed successfully
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
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProductImage'
 *                     processed:
 *                       type: integer
 *                       example: 3
 *                     total:
 *                       type: integer
 *                       example: 3
 *       403:
 *         description: User not associated with partner
 *       404:
 *         description: Product not found
 */
export const handleUploadComplete = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, blobs } = req.body;
    const partnerId = req.user!.partnerId;

    logger.info('Processing upload completion', {
      productId,
      partnerId,
      blobCount: blobs?.length
    });

    if (!partnerId) {
      return res.status(403).json({
        success: false,
        error: 'User is not associated with a partner'
      });
    }

    // Verify product ownership
    const product = await prisma.product.findFirst({
      where: { 
        id: productId, 
        partnerId 
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get current image count for ordering
    const currentImageCount = await prisma.productImage.count({
      where: { productId }
    });

    const processedImages = [];

    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      
      try {
        // Move blob to organized product directory if it's currently in temp
        let finalBlobUrl = blob.url;
        let finalPathname = blob.pathname;
        
        if (blob.pathname.includes('/temp-')) {
          // Extract filename from temp path
          const filename = blob.pathname.split('/').pop() || `image-${i}`;
          const organizedPath = BlobPathUtils.createProductImagePath(partnerId, productId, filename.replace(/^\d+-/, ''));
          
          logger.info('Moving blob to organized product directory', {
            from: blob.pathname,
            to: organizedPath
          });
          
          try {
            // Copy to new organized location
            const response = await fetch(blob.url);
            const buffer = await response.arrayBuffer();
            
            const newBlob = await put(organizedPath, buffer, {
              access: 'public',
              contentType: response.headers.get('content-type') || 'image/jpeg'
            });
            
            // Delete old temp file
            await del(blob.url);
            
            finalBlobUrl = newBlob.url;
            finalPathname = newBlob.pathname;
            
            logger.info('Successfully moved blob to organized directory', {
              newUrl: finalBlobUrl,
              newPathname: finalPathname
            });
          } catch (moveError) {
            logger.error('Failed to move blob, using original location', moveError);
            // Continue with original blob if move fails
          }
        }
        
        // Generate thumbnail with final URL
        const thumbnailUrl = await generateThumbnail(finalBlobUrl, finalPathname);
        
        // Save to database
        const image = await prisma.productImage.create({
          data: {
            productId,
            originalUrl: finalBlobUrl,
            processedUrl: finalBlobUrl, // For now, same as original
            thumbnailUrl: thumbnailUrl || finalBlobUrl,
            order: currentImageCount + i,
            metadata: {
              blobId: finalPathname,
              size: blob.size,
              uploadedAt: new Date().toISOString(),
              organizedPath: finalPathname
            }
          }
        });

        processedImages.push(image);
      } catch (imageError) {
        logger.error('Error processing image:', {
          error: imageError,
          blob
        });
      }
    }

    logger.info('Upload completion processed', {
      productId,
      imagesProcessed: processedImages.length
    });

    return res.status(200).json({
      success: true,
      data: {
        images: processedImages,
        processed: processedImages.length,
        total: blobs.length
      }
    });
  } catch (error) {
    logger.error('Error handling upload completion:', error);
    next(error);
  }
};

async function generateThumbnail(imageUrl: string, pathname: string): Promise<string | null> {
  try {
    logger.info('Generating thumbnail', { imageUrl, pathname });

    // Fetch the image from Blob URL
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Generate thumbnail with Sharp
    const thumbnailBuffer = await sharp(Buffer.from(buffer))
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Create organized thumbnail path
    // Convert: partners/partnerId/products/productId/images/filename.jpg
    // To: partners/partnerId/products/productId/thumbnails/filename-thumb.jpg
    let thumbnailPath;
    if (pathname.includes('/images/')) {
      thumbnailPath = pathname.replace('/images/', '/thumbnails/').replace(/\.[^/.]+$/, '-thumb.jpg');
    } else {
      // Fallback for non-organized paths
      thumbnailPath = `thumbnails/${pathname.replace(/\.[^/.]+$/, '')}-thumb.jpg`;
    }
    
    logger.info('Creating organized thumbnail', {
      originalPath: pathname,
      thumbnailPath
    });

    // Upload thumbnail to Blob
    const thumbnailBlob = await put(thumbnailPath, thumbnailBuffer, {
      access: 'public',
      contentType: 'image/jpeg'
    });

    logger.info('Thumbnail generated successfully', {
      original: imageUrl,
      thumbnail: thumbnailBlob.url
    });

    return thumbnailBlob.url;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    return null;
  }
}

/**
 * @swagger
 * /api/blob/images/{imageId}:
 *   delete:
 *     summary: Delete product image
 *     description: Deletes image from both Vercel Blob storage and database
 *     tags: [Blob Upload]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product image ID
 *         example: "clm123abc456def"
 *     responses:
 *       200:
 *         description: Image deleted successfully
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
 *                   example: "Image deleted successfully"
 *       404:
 *         description: Image not found or access denied
 */
export const deleteImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imageId } = req.params;
    const partnerId = req.user!.partnerId;

    logger.info('Deleting image', { imageId, partnerId });

    // Find the image and verify ownership
    const image = await prisma.productImage.findFirst({
      where: { id: imageId },
      include: {
        product: true
      }
    });

    if (!image || image.product.partnerId !== partnerId) {
      return res.status(404).json({
        success: false,
        error: 'Image not found or access denied'
      });
    }

    // Extract blob pathname from metadata
    const metadata = image.metadata as any;
    if (metadata?.blobId) {
      try {
        // Delete from Vercel Blob
        await del(metadata.blobId);
        logger.info('Deleted from Blob storage', { blobId: metadata.blobId });
      } catch (blobError) {
        logger.error('Error deleting from Blob:', blobError);
        // Continue even if blob deletion fails
      }
    }

    // Delete from database
    await prisma.productImage.delete({
      where: { id: imageId }
    });

    logger.info('Image deleted successfully', { imageId });

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting image:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/blob/test-upload:
 *   post:
 *     summary: Test direct blob upload
 *     description: Tests uploading a file directly to Vercel Blob
 *     tags: [Blob Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               content:
 *                 type: string
 *                 description: Base64 encoded file content
 *     responses:
 *       200:
 *         description: Upload successful
 *       500:
 *         description: Upload failed
 */
/**
 * @swagger
 * /api/blob/direct-upload:
 *   post:
 *     summary: Direct file upload to Vercel Blob
 *     description: Handles direct file uploads without client handshake
 *     tags: [Blob Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               filename:
 *                 type: string
 *               userId:
 *                 type: string
 *               partnerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload successful
 *       500:
 *         description: Upload failed
 */
// Configure multer for memory storage
const uploadMiddleware = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('file');

export const directUpload = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Handle file upload with multer
    uploadMiddleware(req, res, async (err: any) => {
      if (err) {
        logger.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          error: 'File upload failed',
          details: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided'
        });
      }

      const { filename, userId, partnerId } = req.body;
      
      logger.info('Direct upload request', {
        filename: filename || req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        userId,
        partnerId
      });

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({
          success: false,
          error: 'BLOB_READ_WRITE_TOKEN not configured'
        });
      }

      try {
        // Generate organized directory structure using utility
        const organizedPath = BlobPathUtils.createTempUploadPath(partnerId, filename || req.file.originalname);
        
        logger.info('Creating organized blob path', {
          partnerId,
          originalFilename: filename || req.file.originalname,
          organizedPath
        });
        
        // Upload directly to Vercel Blob
        const blob = await put(organizedPath, req.file.buffer, {
          access: 'public',
          contentType: req.file.mimetype,
          token: process.env.BLOB_READ_WRITE_TOKEN
        });

        logger.info('Direct upload successful', {
          url: blob.url,
          pathname: blob.pathname,
          size: req.file.size
        });

        return res.status(200).json({
          success: true,
          blob: {
            url: blob.url,
            pathname: blob.pathname,
            size: req.file.size
          }
        });
      } catch (uploadError: any) {
        logger.error('Blob upload failed:', uploadError);
        return res.status(500).json({
          success: false,
          error: uploadError.message,
          details: uploadError.stack
        });
      }
    });
  } catch (error) {
    logger.error('Direct upload error:', error);
    next(error);
  }
};

export const testDirectUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filename, content } = req.body;
    
    logger.info('Testing direct blob upload', { 
      filename,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      tokenStart: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 30)
    });
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'BLOB_READ_WRITE_TOKEN not configured'
      });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(content, 'base64');
    
    // Create organized test path
    const timestamp = Date.now();
    const testPath = `testing/direct-upload/${timestamp}-${filename}`;
    
    // Upload directly to Vercel Blob
    const blob = await put(testPath, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    logger.info('Direct upload successful', { 
      url: blob.url,
      pathname: blob.pathname
    });
    
    return res.status(200).json({
      success: true,
      blob: {
        url: blob.url,
        pathname: blob.pathname,
        size: buffer.length
      }
    });
  } catch (error: any) {
    logger.error('Direct upload failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
};