import { api } from '../api';

// Order types and interfaces
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  partnerId: string;
  partner: {
    id: string;
    name: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  notes?: string;
  trackingCode?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  items: OrderItem[];
  payments: Payment[];
  pixTransaction?: any;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot: any;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'REFUNDED';

export type PaymentMethod = 
  | 'PIX' 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'CASH';

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  partnerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface CreateOrderData {
  customerId: string;
  partnerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: PaymentMethod;
  shippingCost?: number;
  discount?: number;
  notes?: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  trackingCode?: string;
  notes?: string;
}

export interface OrderStats {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: {
    product: {
      id: string;
      name: string;
      category: string;
      price: number;
    };
    unitsSold: number;
    revenue: number;
  }[];
}

export interface CancelOrderData {
  reason: string;
}

// Status labels for UI display
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Processando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado'
};

// Status colors for UI display
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200'
};

// Payment status labels for UI display
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado'
};

// Payment method labels for UI display
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  CASH: 'Dinheiro'
};

// Order service
export const orderService = {
  /**
   * Get orders with filtering and pagination
   */
  async getOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/api/orders?${params.toString()}`);
    const data = response.data.data;
    
    // Ensure numeric fields are properly parsed
    if (data.orders) {
      data.orders = data.orders.map((order: any) => ({
        ...order,
        subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal,
        shippingCost: typeof order.shippingCost === 'string' ? parseFloat(order.shippingCost) : order.shippingCost,
        discount: typeof order.discount === 'string' ? parseFloat(order.discount) : order.discount,
        total: typeof order.total === 'string' ? parseFloat(order.total) : order.total,
        items: order.items?.map((item: any) => ({
          ...item,
          unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
          totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice
        })) || []
      }));
    }
    
    return data;
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(id: string): Promise<Order> {
    const response = await api.get(`/api/orders/${id}`);
    const order = response.data.data;
    
    // Ensure numeric fields are properly parsed
    return {
      ...order,
      subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal,
      shippingCost: typeof order.shippingCost === 'string' ? parseFloat(order.shippingCost) : order.shippingCost,
      discount: typeof order.discount === 'string' ? parseFloat(order.discount) : order.discount,
      total: typeof order.total === 'string' ? parseFloat(order.total) : order.total,
      items: order.items?.map((item: any) => ({
        ...item,
        unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
        totalPrice: typeof item.totalPrice === 'string' ? parseFloat(item.totalPrice) : item.totalPrice
      })) || []
    };
  },

  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await api.post('/api/orders', data);
    const order = response.data.data;
    
    return {
      ...order,
      subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal,
      shippingCost: typeof order.shippingCost === 'string' ? parseFloat(order.shippingCost) : order.shippingCost,
      discount: typeof order.discount === 'string' ? parseFloat(order.discount) : order.discount,
      total: typeof order.total === 'string' ? parseFloat(order.total) : order.total
    };
  },

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, data: UpdateOrderData): Promise<Order> {
    const response = await api.put(`/api/orders/${id}/status`, data);
    const order = response.data.data;
    
    return {
      ...order,
      subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal,
      shippingCost: typeof order.shippingCost === 'string' ? parseFloat(order.shippingCost) : order.shippingCost,
      discount: typeof order.discount === 'string' ? parseFloat(order.discount) : order.discount,
      total: typeof order.total === 'string' ? parseFloat(order.total) : order.total
    };
  },

  /**
   * Cancel an order
   */
  async cancelOrder(id: string, data: CancelOrderData): Promise<Order> {
    const response = await api.post(`/api/orders/${id}/cancel`, data);
    const order = response.data.data;
    
    return {
      ...order,
      subtotal: typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal,
      shippingCost: typeof order.shippingCost === 'string' ? parseFloat(order.shippingCost) : order.shippingCost,
      discount: typeof order.discount === 'string' ? parseFloat(order.discount) : order.discount,
      total: typeof order.total === 'string' ? parseFloat(order.total) : order.total
    };
  },

  /**
   * Get order statistics
   */
  async getOrderStats(filters: Pick<OrderFilters, 'partnerId' | 'startDate' | 'endDate'> = {}): Promise<OrderStats> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/api/orders/stats?${params.toString()}`);
    const stats = response.data.data;
    
    return {
      ...stats,
      totalRevenue: typeof stats.totalRevenue === 'string' ? parseFloat(stats.totalRevenue) : stats.totalRevenue,
      averageOrderValue: typeof stats.averageOrderValue === 'string' ? parseFloat(stats.averageOrderValue) : stats.averageOrderValue,
      topProducts: stats.topProducts?.map((item: any) => ({
        ...item,
        revenue: typeof item.revenue === 'string' ? parseFloat(item.revenue) : item.revenue
      })) || []
    };
  },

  /**
   * Add a note to an order
   */
  async addOrderNote(id: string, note: string): Promise<Order> {
    const response = await api.post(`/api/orders/${id}/notes`, { note });
    return response.data.data;
  },

  /**
   * Get order timeline/history
   */
  async getOrderTimeline(id: string): Promise<any[]> {
    const response = await api.get(`/api/orders/${id}/timeline`);
    return response.data.data;
  },

  /**
   * Generate shipping label
   */
  async generateShippingLabel(id: string): Promise<{ url: string }> {
    const response = await api.post(`/api/orders/${id}/shipping-label`);
    return response.data.data;
  },

  /**
   * Send notification to customer
   */
  async sendCustomerNotification(id: string, type: 'status_update' | 'tracking' | 'delivery'): Promise<void> {
    await api.post(`/api/orders/${id}/notify`, { type });
  },

  /**
   * Export orders to CSV/Excel
   */
  async exportOrders(filters: OrderFilters = {}, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    params.append('format', format);
    
    const response = await api.get(`/api/orders/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }
};

// Utility functions
export const formatOrderNumber = (orderNumber: string): string => {
  return orderNumber || 'N/A';
};

export const formatOrderStatus = (status: OrderStatus): string => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const formatPaymentStatus = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_LABELS[status] || status;
};

export const formatPaymentMethod = (method: PaymentMethod): string => {
  return PAYMENT_METHOD_LABELS[method] || method;
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

export const formatOrderValue = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

export const formatOrderDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const canUpdateOrderStatus = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  const statusFlow: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: []
  };
  
  return statusFlow[currentStatus]?.includes(newStatus) || false;
};

export const getNextValidStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  const statusFlow: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: []
  };
  
  return statusFlow[currentStatus] || [];
};

export const isOrderCancellable = (status: OrderStatus): boolean => {
  return !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(status);
};

export const requiresTrackingCode = (status: OrderStatus): boolean => {
  return status === 'SHIPPED';
};