import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import * as adminPromoterController from '../controllers/admin.promoter.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { AuthRequest } from '../types';

const router = Router();

router.use(authMiddleware);

router.use((req, res, next) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin role required.'
    });
  }
  next();
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Get comprehensive platform statistics for admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
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
 *                             totalPartners:
 *                               type: integer
 *                             totalUsers:
 *                               type: integer
 *                             totalProducts:
 *                               type: integer
 *                             totalOrders:
 *                               type: integer
 *                             totalRevenue:
 *                               type: number
 *                             monthlyGrowth:
 *                               type: number
 *                         growth:
 *                           type: object
 *                           properties:
 *                             users:
 *                               type: array
 *                             partners:
 *                               type: array
 *                             revenue:
 *                               type: array
 *                         topPerformers:
 *                           type: object
 *                           properties:
 *                             partners:
 *                               type: array
 *                             products:
 *                               type: array
 *                             promoters:
 *                               type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats', adminController.getAdminStats as any);

/**
 * @swagger
 * /api/admin/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Get detailed user analytics for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                         totalUsers:
 *                           type: integer
 *                         activeUsers:
 *                           type: integer
 *                         newUsers:
 *                           type: integer
 *                         usersByRole:
 *                           type: object
 *                         userGrowth:
 *                           type: array
 *                         registrationSources:
 *                           type: array
 *                         userActivity:
 *                           type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/users/stats', adminController.getUserStats as any);

/**
 * @swagger
 * /api/admin/partners/stats:
 *   get:
 *     summary: Get partner statistics
 *     description: Get detailed partner analytics for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: Partner statistics retrieved successfully
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
 *                         totalPartners:
 *                           type: integer
 *                         activePartners:
 *                           type: integer
 *                         newPartners:
 *                           type: integer
 *                         partnerGrowth:
 *                           type: array
 *                         topPartners:
 *                           type: array
 *                         partnerPerformance:
 *                           type: object
 *                         averageRevenue:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/partners/stats', adminController.getPartnerStats as any);

/**
 * @swagger
 * /api/admin/products/stats:
 *   get:
 *     summary: Get product statistics
 *     description: Get detailed product analytics for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: Product statistics retrieved successfully
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
 *                         totalProducts:
 *                           type: integer
 *                         activeProducts:
 *                           type: integer
 *                         soldProducts:
 *                           type: integer
 *                         productsByCategory:
 *                           type: array
 *                         productsByCondition:
 *                           type: array
 *                         priceDistribution:
 *                           type: object
 *                         topProducts:
 *                           type: array
 *                         productGrowth:
 *                           type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/products/stats', adminController.getProductStats as any);

/**
 * @swagger
 * /api/admin/sales/stats:
 *   get:
 *     summary: Get sales statistics
 *     description: Get detailed sales analytics for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: Sales statistics retrieved successfully
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
 *                         totalSales:
 *                           type: number
 *                         totalOrders:
 *                           type: integer
 *                         averageOrderValue:
 *                           type: number
 *                         salesGrowth:
 *                           type: array
 *                         salesByPartner:
 *                           type: array
 *                         salesByCategory:
 *                           type: array
 *                         paymentMethods:
 *                           type: array
 *                         conversionRate:
 *                           type: number
 *                         refundRate:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/sales/stats', adminController.getSalesStats as any);

/**
 * @swagger
 * /api/admin/promoters/pending:
 *   get:
 *     summary: Get pending promoter applications
 *     description: Get list of pending promoter applications requiring approval
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Pending applications retrieved successfully
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
 *                         applications:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               userId:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               phone:
 *                                 type: string
 *                               bio:
 *                                 type: string
 *                               experience:
 *                                 type: string
 *                               socialMedia:
 *                                 type: object
 *                               referralCode:
 *                                 type: string
 *                               appliedAt:
 *                                 type: string
 *                                 format: date-time
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/promoters/pending', adminPromoterController.getPendingPromoterApplications as any);

/**
 * @swagger
 * /api/admin/promoters/approve:
 *   post:
 *     summary: Approve promoter application
 *     description: Approve a pending promoter application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - tier
 *             properties:
 *               applicationId:
 *                 type: string
 *                 description: Promoter application ID
 *               tier:
 *                 type: string
 *                 enum: [BRONZE, SILVER, GOLD, PLATINUM]
 *                 description: Initial promoter tier
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Commission rate (0-1)
 *               notes:
 *                 type: string
 *                 description: Admin notes
 *     responses:
 *       200:
 *         description: Application approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/promoters/approve', adminPromoterController.approvePromoterApplication as any);

/**
 * @swagger
 * /api/admin/promoters/tier:
 *   put:
 *     summary: Update promoter tier
 *     description: Update a promoter's tier and commission rate
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - promoterId
 *               - tier
 *             properties:
 *               promoterId:
 *                 type: string
 *                 description: Promoter ID
 *               tier:
 *                 type: string
 *                 enum: [BRONZE, SILVER, GOLD, PLATINUM]
 *                 description: New promoter tier
 *               commissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: New commission rate (0-1)
 *               reason:
 *                 type: string
 *                 description: Reason for tier change
 *     responses:
 *       200:
 *         description: Promoter tier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/promoters/tier', adminPromoterController.updatePromoterTier as any);

export default router;