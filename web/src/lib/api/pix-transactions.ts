import { api } from '../api';

export interface PixTransaction {
  id: string;
  transactionCode: string;
  partnerId: string;
  productId: string;
  pixKey: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  pixPayload: string;
  qrCodeUrl?: string;
  orderId?: string;
  createdAt: string;
  expiresAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  metadata?: any;
  product?: {
    id: string;
    name: string;
    price: number;
    sku?: string;
  };
  partner?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  order?: {
    id: string;
    orderNumber: string;
  };
}

export interface CreatePixTransactionData {
  transactionCode: string;
  productId: string;
  pixKey: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
  pixPayload: string;
  customerEmail?: string;
  customerPhone?: string;
  expiresIn?: number; // in minutes
}

export interface UpdatePixTransactionStatusData {
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
  orderId?: string;
}

export interface ListPixTransactionsParams {
  status?: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
  productId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

class PixTransactionService {
  // Create a new PIX transaction
  async createPixTransaction(data: CreatePixTransactionData): Promise<PixTransaction> {
    console.log('Create a new PIX transaction');
    const response = await api.post('/api/pix-transactions', data);
    return response.data.transaction;
  }

  // Get PIX transaction by code
  async getPixTransaction(transactionCode: string): Promise<PixTransaction> {
    const response = await api.get(`/api/pix-transactions/${transactionCode}`);
    return response.data.transaction;
  }

  // Update PIX transaction status
  async updatePixTransactionStatus(
    transactionCode: string, 
    data: UpdatePixTransactionStatusData
  ): Promise<PixTransaction> {
    const response = await api.patch(`/api/pix-transactions/${transactionCode}/status`, data);
    return response.data.transaction;
  }

  // List PIX transactions for authenticated partner
  async listPartnerPixTransactions(params?: ListPixTransactionsParams): Promise<PixTransaction[]> {
    const response = await api.get('/api/pix-transactions/partner/list', { params });
    return response.data.transactions;
  }

  // Expire old transactions (admin)
  async expireOldTransactions(): Promise<{ expiredCount: number }> {
    const response = await api.post('/api/pix-transactions/admin/expire');
    return response.data;
  }
}

export const pixTransactionService = new PixTransactionService();