import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/pix-transactions:
 *   post:
 *     summary: Create a new PIX transaction
 *     description: Creates a PIX transaction record when QR code is generated
 *     tags: [PIX Transactions]
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
 *                   example: true
 *                 transaction:
 *                   $ref: '#/components/schemas/PixTransaction'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Transaction code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const createPixTransaction = async (req: Request, res: Response) => {
  try {
    const { 
      transactionCode,
      productId,
      pixKey,
      amount,
      merchantName,
      merchantCity,
      pixPayload,
      customerEmail,
      customerPhone,
      expiresIn // in minutes, optional
    } = req.body;

    // Get the product to verify it exists and get partner info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { partner: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user has access to this partner's products
    const userId = (req as any).user?.id;
    const userPartnerId = (req as any).user?.partnerId;
    
    if (userPartnerId && userPartnerId !== product.partnerId) {
      return res.status(403).json({ error: 'Access denied to this product' });
    }

    // Check if transaction code already exists
    const existingTransaction = await prisma.pixTransaction.findUnique({
      where: { transactionCode }
    });

    if (existingTransaction) {
      return res.status(409).json({ error: 'Transaction code already exists' });
    }

    // Calculate expiration time if provided
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 60 * 1000)
      : undefined;

    // Get customer if user is authenticated as customer
    let customerId = null;
    if ((req as any).user?.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { email: (req as any).user.email }
      });
      if (customer) {
        customerId = customer.id;
      }
    }

    // Create the PIX transaction
    const pixTransaction = await prisma.pixTransaction.create({
      data: {
        transactionCode,
        partnerId: product.partnerId,
        productId,
        pixKey,
        amount,
        merchantName,
        merchantCity,
        pixPayload,
        customerEmail,
        customerPhone,
        customerId,
        expiresAt,
        metadata: {
          productName: product.name,
          productSku: product.sku,
          generatedBy: userId || 'anonymous',
          generatedAt: new Date().toISOString()
        }
      },
      include: {
        product: true,
        partner: true
      }
    });

    res.status(201).json({
      success: true,
      transaction: pixTransaction
    });
  } catch (error) {
    console.error('Error creating PIX transaction:', error);
    res.status(500).json({ error: 'Failed to create PIX transaction' });
  }
};

/**
 * @swagger
 * /api/pix-transactions/{transactionCode}:
 *   get:
 *     summary: Get PIX transaction by code
 *     description: Retrieves a PIX transaction by its unique transaction code
 *     tags: [PIX Transactions]
 *     parameters:
 *       - in: path
 *         name: transactionCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique transaction code
 *         example: PROD-123456
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
 *                   example: true
 *                 transaction:
 *                   $ref: '#/components/schemas/PixTransaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const getPixTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionCode } = req.params;

    const transaction = await prisma.pixTransaction.findUnique({
      where: { transactionCode },
      include: {
        product: true,
        partner: true,
        customer: true,
        order: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching PIX transaction:', error);
    res.status(500).json({ error: 'Failed to fetch PIX transaction' });
  }
};

/**
 * @swagger
 * /api/pix-transactions/{transactionCode}/status:
 *   patch:
 *     summary: Update PIX transaction status
 *     description: Updates the status of a PIX transaction (webhook or admin endpoint)
 *     tags: [PIX Transactions]
 *     parameters:
 *       - in: path
 *         name: transactionCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique transaction code
 *         example: PROD-123456
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
 *                   example: true
 *                 transaction:
 *                   $ref: '#/components/schemas/PixTransaction'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const updatePixTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { transactionCode } = req.params;
    const { status, orderId } = req.body;

    const transaction = await prisma.pixTransaction.findUnique({
      where: { transactionCode }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Prepare update data based on status
    const updateData: any = { status };
    
    if (status === 'PAID') {
      updateData.paidAt = new Date();
      if (orderId) {
        updateData.orderId = orderId;
      }
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    } else if (status === 'EXPIRED') {
      // Check if transaction has actually expired
      if (transaction.expiresAt && new Date() < transaction.expiresAt) {
        return res.status(400).json({ error: 'Transaction has not expired yet' });
      }
    }

    const updatedTransaction = await prisma.pixTransaction.update({
      where: { transactionCode },
      data: updateData,
      include: {
        product: true,
        partner: true,
        customer: true,
        order: true
      }
    });

    res.json({
      success: true,
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error updating PIX transaction:', error);
    res.status(500).json({ error: 'Failed to update PIX transaction' });
  }
};

/**
 * @swagger
 * /api/pix-transactions/partner/list:
 *   get:
 *     summary: List PIX transactions for authenticated partner
 *     description: Retrieves PIX transactions for the authenticated partner with optional filtering
 *     tags: [PIX Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, EXPIRED, CANCELLED, REFUNDED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter transactions after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter transactions before this date
 *     responses:
 *       200:
 *         description: PIX transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PixTransaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const listPartnerPixTransactions = async (req: Request, res: Response) => {
  try {
    const userPartnerId = (req as any).user?.partnerId;
    
    if (!userPartnerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, productId, customerId, startDate, endDate } = req.query;

    const where: any = { partnerId: userPartnerId };
    
    if (status) {
      where.status = status;
    }
    
    if (productId) {
      where.productId = productId;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const transactions = await prisma.pixTransaction.findMany({
      where,
      include: {
        product: true,
        customer: true,
        order: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error listing PIX transactions:', error);
    res.status(500).json({ error: 'Failed to list PIX transactions' });
  }
};

/**
 * @swagger
 * /api/pix-transactions/admin/expire:
 *   post:
 *     summary: Expire old PIX transactions
 *     description: Marks expired transactions as EXPIRED (admin/cron endpoint)
 *     tags: [PIX Transactions]
 *     security:
 *       - bearerAuth: []
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
 *                   example: true
 *                 expiredCount:
 *                   type: integer
 *                   description: Number of transactions expired
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const expireOldTransactions = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const expiredTransactions = await prisma.pixTransaction.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lte: now
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    res.json({
      success: true,
      expiredCount: expiredTransactions.count
    });
  } catch (error) {
    console.error('Error expiring transactions:', error);
    res.status(500).json({ error: 'Failed to expire transactions' });
  }
};