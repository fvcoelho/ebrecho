import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { AuthRequest } from '../types';

const router = Router();

router.use(authMiddleware);

router.use((req, res, next) => {
  const authReq = req as AuthRequest;
  const allowedRoles = ['PARTNER_ADMIN', 'PARTNER_USER'];
  if (!authReq.user?.role || !allowedRoles.includes(authReq.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Partner role required.'
    });
  }
  next();
});

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get partner dashboard statistics
 *     description: Get comprehensive statistics for the partner dashboard
 *     tags: [Dashboard]
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
 *         description: Dashboard statistics retrieved successfully
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
 *                         totalSales:
 *                           type: number
 *                         totalRevenue:
 *                           type: number
 *                         totalOrders:
 *                           type: integer
 *                         pendingOrders:
 *                           type: integer
 *                         totalCustomers:
 *                           type: integer
 *                         newCustomers:
 *                           type: integer
 *                         conversionRate:
 *                           type: number
 *                         averageOrderValue:
 *                           type: number
 *                         revenueChart:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               revenue:
 *                                 type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/stats', dashboardController.getPartnerDashboardStats as any);

/**
 * @swagger
 * /api/dashboard/sales:
 *   get:
 *     summary: Get partner sales history
 *     description: Get detailed sales history for the partner
 *     tags: [Dashboard]
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
 *         description: Sales history retrieved successfully
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
 *                         sales:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               orderNumber:
 *                                 type: string
 *                               customerName:
 *                                 type: string
 *                               total:
 *                                 type: number
 *                               status:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/sales', dashboardController.getPartnerSalesHistory as any);

/**
 * @swagger
 * /api/dashboard/products/stats:
 *   get:
 *     summary: Get partner product statistics
 *     description: Get detailed product performance statistics
 *     tags: [Dashboard]
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
 *                         productsByStatus:
 *                           type: object
 *                           properties:
 *                             active:
 *                               type: integer
 *                             draft:
 *                               type: integer
 *                             sold:
 *                               type: integer
 *                             inactive:
 *                               type: integer
 *                         productsByCategory:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               category:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                         topProducts:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               views:
 *                                 type: integer
 *                               sales:
 *                                 type: integer
 *                               revenue:
 *                                 type: number
 *                         lowStockProducts:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               stock:
 *                                 type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/products/stats', dashboardController.getPartnerProductStats as any);

/**
 * @swagger
 * /api/dashboard/insights/customers:
 *   get:
 *     summary: Get partner customer insights
 *     description: Get customer behavior insights and analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Analysis period
 *     responses:
 *       200:
 *         description: Customer insights retrieved successfully
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
 *                         totalCustomers:
 *                           type: integer
 *                         newCustomers:
 *                           type: integer
 *                         returningCustomers:
 *                           type: integer
 *                         averageOrderValue:
 *                           type: number
 *                         customerLifetimeValue:
 *                           type: number
 *                         topCustomers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               totalOrders:
 *                                 type: integer
 *                               totalSpent:
 *                                 type: number
 *                         customerSegments:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               segment:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                               percentage:
 *                                 type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/insights/customers', dashboardController.getPartnerCustomerInsights as any);

/**
 * @swagger
 * /api/dashboard/partner:
 *   get:
 *     summary: Get current partner profile
 *     description: Get the current partner's profile information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Partner'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/partner', dashboardController.getCurrentPartner as any);

/**
 * @swagger
 * /api/dashboard/partner:
 *   put:
 *     summary: Update current partner profile
 *     description: Update the current partner's profile information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               instagram:
 *                 type: string
 *               facebook:
 *                 type: string
 *               businessHours:
 *                 type: object
 *               settings:
 *                 type: object
 *                 properties:
 *                   acceptsReturns:
 *                     type: boolean
 *                   returnPeriodDays:
 *                     type: integer
 *                   shippingMethods:
 *                     type: array
 *                     items:
 *                       type: string
 *                   paymentMethods:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Partner profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Partner'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/partner', dashboardController.updateCurrentPartner as any);

export default router;