import { Router } from 'express';
import {
  testBlobConnection,
  testDirectUpload,
  directUpload,
  generateUploadToken,
  handleClientUpload,
  handleUploadComplete,
  deleteImage
} from '../controllers/blob-upload.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

// Test blob connection (no auth needed for testing)
router.get('/test-connection', testBlobConnection);

// Test direct upload (no auth needed for testing)
router.post('/test-upload', testDirectUpload);

// Direct upload with auth
router.post('/direct-upload', authMiddleware, directUpload);

// Schema validation
const generateTokenSchema = z.object({
  productId: z.string().optional(),
  fileCount: z.number().min(1).max(10).optional()
});

const uploadCompleteSchema = z.object({
  productId: z.string(),
  blobs: z.array(z.object({
    url: z.string().url(),
    pathname: z.string(),
    size: z.number()
  }))
});

// Generate upload token for client
router.post(
  '/upload-token',
  authMiddleware,
  validate(z.object({ body: generateTokenSchema })),
  generateUploadToken
);

// Handle client upload (this is called by Vercel Blob client)
router.post(
  '/client-upload',
  handleClientUpload
);

// Handle upload completion notification
router.post(
  '/upload-complete',
  authMiddleware,
  validate(z.object({ body: uploadCompleteSchema })),
  handleUploadComplete
);

// Delete image
router.delete(
  '/images/:imageId',
  authMiddleware,
  deleteImage
);

export default router;