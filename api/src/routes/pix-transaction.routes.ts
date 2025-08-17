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

// Create a new PIX transaction (public endpoint for QR code generation)
router.post(
  '/',
  validate(createPixTransactionSchema),
  createPixTransaction
);

// Get PIX transaction by code (public endpoint for payment verification)
router.get(
  '/:transactionCode',
  validate(getPixTransactionSchema),
  getPixTransaction
);

// Update PIX transaction status (webhook or admin endpoint)
router.patch(
  '/:transactionCode/status',
  validate(updatePixTransactionStatusSchema),
  updatePixTransactionStatus
);

// List PIX transactions for authenticated partner
router.get(
  '/partner/list',
  authMiddleware,
  validate(listPartnerPixTransactionsSchema),
  listPartnerPixTransactions
);

// Expire old transactions (admin/cron endpoint)
router.post(
  '/admin/expire',
  authMiddleware,
  expireOldTransactions
);

export default router;