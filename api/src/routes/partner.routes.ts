import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import {
  createPartner,
  getPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
  uploadPartnerLogo
} from '../controllers/partner.controller';
import { getAiInstructions, updateAiInstructions, deleteAiInstructions } from '../controllers/ai-instructions.controller';
import {
  createPartnerSchema,
  updatePartnerSchema,
  partnerParamsSchema
} from '../schemas/partner.schema';

const router = Router();

// All partner routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/partners:
 *   get:
 *     summary: Get all partners
 *     description: Retrieve a list of all partner stores. Admin only.
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by partner name or email
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Partners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Partner'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', authorize(['ADMIN']), getPartners);

/**
 * @swagger
 * /api/partners/logo:
 *   put:
 *     summary: Upload partner logo
 *     description: Upload and update partner logo. Partner Admins can update their own logo.
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file (JPEG, PNG, WebP)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/logo', uploadSingle('logo'), authorize(['PARTNER_ADMIN']), uploadPartnerLogo);

/**
 * @swagger
 * /api/partners/{id}:
 *   get:
 *     summary: Get partner by ID
 *     description: Retrieve a specific partner by ID. Admins can view any partner, Partner Admins can view their own partner.
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validate(partnerParamsSchema), authorize(['ADMIN', 'PARTNER_ADMIN']), getPartnerById);

/**
 * @swagger
 * /api/partners:
 *   post:
 *     summary: Create a new partner
 *     description: Create a new partner store. Admin only.
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - document
 *               - documentType
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Fashion Store
 *               email:
 *                 type: string
 *                 format: email
 *                 example: store@example.com
 *               phone:
 *                 type: string
 *                 pattern: '^\(\d{2}\)\s\d{4,5}-\d{4}$'
 *                 example: (11) 98765-4321
 *               document:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 18
 *                 example: 12.345.678/0001-90
 *               documentType:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *                 example: CNPJ
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Premium fashion resale store
 *               logo:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/logo.png
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - number
 *                   - neighborhood
 *                   - city
 *                   - state
 *                   - zipCode
 *                 properties:
 *                   street:
 *                     type: string
 *                     minLength: 5
 *                     example: Rua Exemplo
 *                   number:
 *                     type: string
 *                     minLength: 1
 *                     example: 123
 *                   complement:
 *                     type: string
 *                     example: Sala 101
 *                   neighborhood:
 *                     type: string
 *                     minLength: 2
 *                     example: Centro
 *                   city:
 *                     type: string
 *                     minLength: 2
 *                     example: São Paulo
 *                   state:
 *                     type: string
 *                     length: 2
 *                     example: SP
 *                   zipCode:
 *                     type: string
 *                     pattern: '^\d{5}-?\d{3}$'
 *                     example: 01234-567
 *     responses:
 *       201:
 *         description: Partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Partner already exists
 */
router.post('/', validate(createPartnerSchema), authorize(['ADMIN']), createPartner);

/**
 * @swagger
 * /api/partners/{id}:
 *   put:
 *     summary: Update partner
 *     description: Update partner information. Admins can update any partner, Partner Admins can update their own partner.
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 pattern: '^\(\d{2}\)\s\d{4,5}-\d{4}$'
 *               document:
 *                 type: string
 *                 minLength: 11
 *                 maxLength: 18
 *               documentType:
 *                 type: string
 *                 enum: [CPF, CNPJ]
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               logo:
 *                 type: string
 *                 format: uri
 *               isActive:
 *                 type: boolean
 *                 description: Admin only field
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', validate(partnerParamsSchema), validate(updatePartnerSchema), authorize(['ADMIN', 'PARTNER_ADMIN']), updatePartner);

/**
 * @swagger
 * /api/partners/{partnerId}/ai-instructions:
 *   get:
 *     summary: Get AI instructions for partner
 *     description: Retrieve AI instructions for a partner's WhatsApp bot integration
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: AI instructions retrieved successfully
 *       404:
 *         description: AI instructions not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:partnerId/ai-instructions', authorize(['PARTNER_ADMIN', 'ADMIN']), getAiInstructions);

/**
 * @swagger
 * /api/partners/{partnerId}/ai-instructions:
 *   put:
 *     summary: Update AI instructions for partner
 *     description: Create or update AI instructions for a partner's WhatsApp bot integration
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: AI instructions in markdown format with template variables
 *     responses:
 *       200:
 *         description: AI instructions updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Partner not found
 */
router.put('/:partnerId/ai-instructions', authorize(['PARTNER_ADMIN', 'ADMIN']), updateAiInstructions);

/**
 * @swagger
 * /api/partners/{partnerId}/ai-instructions:
 *   delete:
 *     summary: Delete AI instructions for partner
 *     description: Delete AI instructions for a partner (will fallback to default instructions)
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: AI instructions deleted successfully
 *       404:
 *         description: AI instructions not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/:partnerId/ai-instructions', authorize(['PARTNER_ADMIN', 'ADMIN']), deleteAiInstructions);

/**
 * @swagger
 * /api/partners/{id}:
 *   delete:
 *     summary: Delete partner
 *     description: Delete a partner store and all associated data. Admin only.
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', validate(partnerParamsSchema), authorize(['ADMIN']), deletePartner);

export default router;