import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validate.middleware';
import { 
  createSessionSchema,
  createPageViewSchema,
  createActivitySchema,
  analyticsQuerySchema,
  sessionDetailQuerySchema,
  dashboardStatsQuerySchema
} from '../schemas/analytics.schemas';

const router = Router();

/**
 * @swagger
 * /api/analytics/sessions:
 *   post:
 *     summary: Create a new user session
 *     description: Create a new analytics session to track user behavior
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Unique session identifier
 *               ipAddress:
 *                 type: string
 *                 description: User's IP address
 *               userAgent:
 *                 type: string
 *                 description: User's browser user agent
 *               referrer:
 *                 type: string
 *                 description: Referrer URL
 *               landingPage:
 *                 type: string
 *                 description: First page visited
 *               partnerId:
 *                 type: string
 *                 description: Partner ID for multi-tenant analytics
 *     responses:
 *       201:
 *         description: Session created successfully
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/sessions', validate(createSessionSchema), analyticsController.createSession);

/**
 * @swagger
 * /api/analytics/sessions/{sessionId}:
 *   get:
 *     summary: Get session details
 *     description: Retrieve detailed information about a specific session
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session details retrieved successfully
 *       404:
 *         description: Session not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sessions/:sessionId', authenticate, authorize(['ADMIN', 'PARTNER_ADMIN']), analyticsController.getSession);

/**
 * @swagger
 * /api/analytics/sessions/{sessionId}:
 *   put:
 *     summary: Update session information
 *     description: Update an existing session with additional information
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               device:
 *                 type: string
 *               browser:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session updated successfully
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/sessions/:sessionId', analyticsController.updateSession);

/**
 * @swagger
 * /api/analytics/page-views:
 *   post:
 *     summary: Track a page view
 *     description: Record a page view event for analytics
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - page
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session ID
 *               page:
 *                 type: string
 *                 description: Page URL or path
 *               title:
 *                 type: string
 *                 description: Page title
 *               timeSpent:
 *                 type: number
 *                 description: Time spent on page in seconds
 *               partnerId:
 *                 type: string
 *                 description: Partner ID for multi-tenant analytics
 *     responses:
 *       201:
 *         description: Page view tracked successfully
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/page-views', validate(createPageViewSchema), analyticsController.trackPageView);

/**
 * @swagger
 * /api/analytics/activities:
 *   post:
 *     summary: Track user activity
 *     description: Record a user interaction event (click, hover, etc.)
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - page
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session ID
 *               page:
 *                 type: string
 *                 description: Page URL or path where activity occurred
 *               elementId:
 *                 type: string
 *                 description: HTML element ID
 *               elementText:
 *                 type: string
 *                 description: Text content of the element
 *               elementType:
 *                 type: string
 *                 description: Type of element (button, link, etc.)
 *               partnerId:
 *                 type: string
 *                 description: Partner ID for multi-tenant analytics
 *     responses:
 *       201:
 *         description: Activity tracked successfully
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/activities', validate(createActivitySchema), analyticsController.trackActivity);

/**
 * @swagger
 * /api/analytics/activities/recent:
 *   get:
 *     summary: Get recent user activities
 *     description: Retrieve recent user interaction events with pagination
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter by partner ID (admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, page, elementText]
 *           default: createdAt
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Order direction
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/activities/recent', authenticate, authorize(['ADMIN', 'PARTNER_ADMIN']), validate(analyticsQuerySchema), analyticsController.getRecentActivities);

/**
 * @swagger
 * /api/analytics/page-views/recent:
 *   get:
 *     summary: Get recent page views
 *     description: Retrieve recent page view events with pagination
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter by partner ID (admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Recent page views retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/page-views/recent', authenticate, authorize(['ADMIN', 'PARTNER_ADMIN']), validate(analyticsQuerySchema), analyticsController.getRecentPageViews);

/**
 * @swagger
 * /api/analytics/sessions/recent:
 *   get:
 *     summary: Get recent sessions
 *     description: Retrieve recent user sessions with pagination
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter by partner ID (admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Recent sessions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sessions/recent', authenticate, authorize(['ADMIN', 'PARTNER_ADMIN']), validate(analyticsQuerySchema), analyticsController.getSessions);

/**
 * @swagger
 * /api/analytics/dashboard/stats:
 *   get:
 *     summary: Get dashboard analytics statistics
 *     description: Retrieve aggregated analytics data for dashboard display
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter by partner ID (admin only)
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard/stats', authenticate, authorize(['ADMIN', 'PARTNER_ADMIN']), validate(dashboardStatsQuerySchema), analyticsController.getDashboardStats);

/**
 * @swagger
 * /api/analytics/comprehensive:
 *   get:
 *     summary: Get comprehensive analytics data
 *     description: Retrieve all analytics data including activities, page views, and stats
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter by partner ID (admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Comprehensive analytics data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/comprehensive', authenticate, authorize(['ADMIN', 'PARTNER_ADMIN']), validate(analyticsQuerySchema), analyticsController.getComprehensiveAnalytics);

/**
 * @swagger
 * /api/analytics/recent:
 *   get:
 *     summary: Get recent analytics (for existing frontend)
 *     description: Get comprehensive analytics data in the format expected by the existing frontend
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Items per page
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, page, elementText]
 *           default: createdAt
 *         description: Field to order by
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Order direction
 *     responses:
 *       200:
 *         description: Recent analytics data retrieved successfully
 */
router.get('/recent', validate(analyticsQuerySchema), analyticsController.getRecentAnalytics);

export default router;