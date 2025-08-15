import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { promoterMiddleware, canApplyPromoterMiddleware } from '../middlewares/promoter.middleware';
import {
  promoterApplicationSchema,
  promoterUpdateSchema,
  createInvitationSchema,
  updateInvitationSchema,
  createEventSchema,
  updateEventSchema,
  eventInvitePartnersSchema,
  payoutRequestSchema,
} from '../schemas/promoter.schema';
import {
  applyForPromoter,
  getPromoterProfile,
  updatePromoterProfile,
  createInvitation,
  getInvitations,
  updateInvitation,
  cancelInvitation,
  getPromoterAnalytics,
  getCommissions,
} from '../controllers/promoter.controller';
import marketIntelligenceRoutes from './promoter/market-intelligence.routes';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/promoter/apply:
 *   post:
 *     summary: Apply for promoter role
 *     description: Submit an application to become a promoter
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bio
 *               - experience
 *               - socialMedia
 *             properties:
 *               bio:
 *                 type: string
 *                 description: Promoter biography
 *                 example: "Experienced fashion enthusiast with 5 years in retail"
 *               experience:
 *                 type: string
 *                 description: Relevant experience
 *                 example: "Managed social media for local fashion brands"
 *               socialMedia:
 *                 type: object
 *                 properties:
 *                   instagram:
 *                     type: string
 *                     example: "@fashionpromoter"
 *                   facebook:
 *                     type: string
 *                     example: "facebook.com/fashionpromoter"
 *                   tiktok:
 *                     type: string
 *                     example: "@fashionpromoter"
 *                   followers:
 *                     type: integer
 *                     example: 5000
 *               phone:
 *                 type: string
 *                 example: "+5511999999999"
 *               referralCode:
 *                 type: string
 *                 description: Optional referral code from existing promoter
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: User not eligible or already applied
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/apply', canApplyPromoterMiddleware, validate(promoterApplicationSchema), applyForPromoter);

// All other routes require PROMOTER role
router.use(promoterMiddleware);

/**
 * @swagger
 * /api/promoter/profile:
 *   get:
 *     summary: Get promoter profile
 *     description: Get the current promoter's profile information
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                         id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         tier:
 *                           type: string
 *                           enum: [BRONZE, SILVER, GOLD, PLATINUM]
 *                         status:
 *                           type: string
 *                           enum: [PENDING, APPROVED, REJECTED, SUSPENDED]
 *                         bio:
 *                           type: string
 *                         experience:
 *                           type: string
 *                         socialMedia:
 *                           type: object
 *                         phone:
 *                           type: string
 *                         commissionRate:
 *                           type: number
 *                         totalCommissions:
 *                           type: number
 *                         totalInvitations:
 *                           type: integer
 *                         successfulInvitations:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/profile', getPromoterProfile);

/**
 * @swagger
 * /api/promoter/profile:
 *   put:
 *     summary: Update promoter profile
 *     description: Update the current promoter's profile information
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               experience:
 *                 type: string
 *               socialMedia:
 *                 type: object
 *                 properties:
 *                   instagram:
 *                     type: string
 *                   facebook:
 *                     type: string
 *                   tiktok:
 *                     type: string
 *                   followers:
 *                     type: integer
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/profile', validate(promoterUpdateSchema), updatePromoterProfile);

/**
 * @swagger
 * /api/promoter/invitations:
 *   post:
 *     summary: Create invitation
 *     description: Create a new invitation to invite someone as a partner
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Invitee's email address
 *               name:
 *                 type: string
 *                 description: Invitee's name
 *               message:
 *                 type: string
 *                 description: Personal message to include in invitation
 *               expiresIn:
 *                 type: integer
 *                 description: Expiration time in days
 *                 default: 30
 *     responses:
 *       201:
 *         description: Invitation created successfully
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
 *                         id:
 *                           type: string
 *                         code:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         message:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/invitations', validate(createInvitationSchema), createInvitation);

/**
 * @swagger
 * /api/promoter/invitations:
 *   get:
 *     summary: Get invitations
 *     description: Get list of invitations sent by the promoter
 *     tags: [Promoter]
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, DECLINED, EXPIRED]
 *         description: Filter by invitation status
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
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
 *                         invitations:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               code:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                                 enum: [PENDING, ACCEPTED, DECLINED, EXPIRED]
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               expiresAt:
 *                                 type: string
 *                                 format: date-time
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter
 */
router.get('/invitations', getInvitations);

/**
 * @swagger
 * /api/promoter/invitations/{id}:
 *   put:
 *     summary: Update invitation
 *     description: Update an existing invitation
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Updated personal message
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: New expiration date
 *     responses:
 *       200:
 *         description: Invitation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter or doesn't own invitation
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/invitations/:id', validate(updateInvitationSchema), updateInvitation);

/**
 * @swagger
 * /api/promoter/invitations/{id}:
 *   delete:
 *     summary: Cancel invitation
 *     description: Cancel a pending invitation
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter or doesn't own invitation
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       400:
 *         description: Invitation cannot be cancelled
 */
router.delete('/invitations/:id', cancelInvitation);

/**
 * @swagger
 * /api/promoter/analytics:
 *   get:
 *     summary: Get promoter analytics
 *     description: Get analytics and performance metrics for the promoter
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Analytics period
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
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
 *                         overview:
 *                           type: object
 *                           properties:
 *                             totalInvitations:
 *                               type: integer
 *                             successfulInvitations:
 *                               type: integer
 *                             conversionRate:
 *                               type: number
 *                             totalCommissions:
 *                               type: number
 *                             thisMonthCommissions:
 *                               type: number
 *                         invitationStats:
 *                           type: object
 *                           properties:
 *                             byStatus:
 *                               type: object
 *                             byMonth:
 *                               type: array
 *                         commissionStats:
 *                           type: object
 *                           properties:
 *                             byMonth:
 *                               type: array
 *                             byPartner:
 *                               type: array
 *                         topPerformers:
 *                           type: object
 *                           properties:
 *                             partners:
 *                               type: array
 *                             products:
 *                               type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter
 */
router.get('/analytics', getPromoterAnalytics);

/**
 * @swagger
 * /api/promoter/commissions:
 *   get:
 *     summary: Get commissions
 *     description: Get commission history and details for the promoter
 *     tags: [Promoter]
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, PAID, CANCELLED]
 *         description: Filter by commission status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *     responses:
 *       200:
 *         description: Commissions retrieved successfully
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
 *                         commissions:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               orderId:
 *                                 type: string
 *                               partnerId:
 *                                 type: string
 *                               partnerName:
 *                                 type: string
 *                               orderAmount:
 *                                 type: number
 *                               commissionRate:
 *                                 type: number
 *                               commissionAmount:
 *                                 type: number
 *                               status:
 *                                 type: string
 *                                 enum: [PENDING, APPROVED, PAID, CANCELLED]
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               paidAt:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                         summary:
 *                           type: object
 *                           properties:
 *                             totalCommissions:
 *                               type: number
 *                             pendingCommissions:
 *                               type: number
 *                             paidCommissions:
 *                               type: number
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User is not a promoter
 */
router.get('/commissions', getCommissions);

// Market Intelligence & Brechó Discovery
router.use('/market-intelligence', marketIntelligenceRoutes);

export default router;