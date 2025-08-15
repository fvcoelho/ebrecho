import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadProductImages } from '../middlewares/upload.middleware';
import {
  uploadProductImages as uploadController,
  deleteProductImage,
  reorderProductImages,
  cropProductImage
} from '../controllers/image.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/images/products/{productId}/images:
 *   post:
 *     summary: Upload product images
 *     description: Upload multiple images for a product
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files to upload
 *               order:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Display order for images
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         images:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ProductImage'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       413:
 *         description: File too large
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/products/:productId/images', 
  uploadProductImages, 
  uploadController
);

/**
 * @swagger
 * /api/images/products/{productId}/images/{imageId}:
 *   delete:
 *     summary: Delete product image
 *     description: Delete a specific product image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/products/:productId/images/:imageId', deleteProductImage);

/**
 * @swagger
 * /api/images/products/{productId}/images/reorder:
 *   put:
 *     summary: Reorder product images
 *     description: Change the display order of product images
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageOrder
 *             properties:
 *               imageOrder:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Images reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/products/:productId/images/reorder', reorderProductImages);

/**
 * @swagger
 * /api/images/products/{productId}/images/{imageId}/crop:
 *   put:
 *     summary: Crop product image
 *     description: Crop or edit an existing product image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cropData
 *             properties:
 *               cropData:
 *                 type: object
 *                 properties:
 *                   x:
 *                     type: number
 *                     description: X coordinate
 *                   y:
 *                     type: number
 *                     description: Y coordinate
 *                   width:
 *                     type: number
 *                     description: Crop width
 *                   height:
 *                     type: number
 *                     description: Crop height
 *                   rotate:
 *                     type: number
 *                     description: Rotation angle in degrees
 *     responses:
 *       200:
 *         description: Image cropped successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProductImage'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/products/:productId/images/:imageId/crop', cropProductImage);

export default router;