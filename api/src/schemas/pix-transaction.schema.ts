import { z } from 'zod';

export const createPixTransactionSchema = z.object({
  body: z.object({
    transactionCode: z.string().min(1, 'Transaction code is required'),
    productId: z.string().min(1, 'Product ID is required'),
    pixKey: z.string().min(1, 'PIX key is required'),
    amount: z.number().positive('Amount must be positive'),
    merchantName: z.string().min(1, 'Merchant name is required'),
    merchantCity: z.string().min(1, 'Merchant city is required'),
    pixPayload: z.string().min(1, 'PIX payload is required'),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    expiresIn: z.number().positive().optional() // in minutes
  })
});

export const updatePixTransactionStatusSchema = z.object({
  params: z.object({
    transactionCode: z.string().min(1, 'Transaction code is required')
  }),
  body: z.object({
    status: z.enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED']),
    orderId: z.string().optional()
  })
});

export const getPixTransactionSchema = z.object({
  params: z.object({
    transactionCode: z.string().min(1, 'Transaction code is required')
  })
});

export const listPartnerPixTransactionsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED']).optional(),
    productId: z.string().optional(),
    customerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  })
});