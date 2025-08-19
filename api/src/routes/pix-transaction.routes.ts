import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createPixTransaction,
  getPixTransaction,
  updatePixTransactionStatus,
  listPartnerPixTransactions,
  expireOldTransactions
} from '../controllers/pix-transaction.controller';
import {
  createPixTransactionSchema,
  getPixTransactionSchema,
  updatePixTransactionStatusSchema,
  listPartnerPixTransactionsSchema
} from '../schemas/pix-transaction.schema';

const router = Router();

/**
 * @swagger
 * /api/pix-transactions:
 *   post:
 *     summary: Create a new PIX transaction
 *     tags: [PIX Transactions]
 *     description: Public endpoint to create a PIX transaction and generate QR code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePixTransactionRequest'
 *     responses:
 *       201:
 *         description: PIX transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/PixTransaction'
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  validate(createPixTransactionSchema),
  createPixTransaction
);

/**
 * @swagger
 * /api/pix-transactions/{transactionCode}:
 *   get:
 *     summary: Get PIX transaction by code
 *     tags: [PIX Transactions]
 *     description: Public endpoint to retrieve PIX transaction details for payment verification
 *     parameters:
 *       - in: path
 *         name: transactionCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique transaction code (e.g., PROD-123456)
 *     responses:
 *       200:
 *         description: PIX transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/PixTransaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:transactionCode',
  validate(getPixTransactionSchema),
  getPixTransaction
);

/**
 * @swagger
 * /api/pix-transactions/{transactionCode}/status:
 *   patch:
 *     summary: Update PIX transaction status
 *     tags: [PIX Transactions]
 *     description: Webhook or admin endpoint to update transaction status
 *     parameters:
 *       - in: path
 *         name: transactionCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique transaction code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePixTransactionStatusRequest'
 *     responses:
 *       200:
 *         description: Transaction status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/PixTransaction'
 *                     order:
 *                       type: object
 *                       description: Created order (if status is PAID)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:transactionCode/status',
  validate(updatePixTransactionStatusSchema),
  updatePixTransactionStatus
);

/**
 * @swagger
 * /api/pix-transactions/partner/list:
 *   get:
 *     summary: List partner PIX transactions
 *     tags: [PIX Transactions]
 *     security:
 *       - bearerAuth: []
 *     description: List PIX transactions for the authenticated partner
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
 *           enum: [PENDING, PAID, EXPIRED, CANCELLED, REFUNDED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PixTransaction'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/partner/list',
  authMiddleware,
  validate(listPartnerPixTransactionsSchema),
  listPartnerPixTransactions
);

/**
 * @swagger
 * /api/pix-transactions/admin/expire:
 *   post:
 *     summary: Expire old PIX transactions
 *     tags: [PIX Transactions]
 *     security:
 *       - bearerAuth: []
 *     description: Admin/cron endpoint to expire old pending transactions
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               olderThanMinutes:
 *                 type: integer
 *                 default: 30
 *                 description: Expire transactions older than this many minutes
 *     responses:
 *       200:
 *         description: Transactions expired successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     expiredCount:
 *                       type: integer
 *                       description: Number of transactions expired
 *                     expiredTransactions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of expired transaction codes
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post(
  '/admin/expire',
  authMiddleware,
  expireOldTransactions
);

export default router;