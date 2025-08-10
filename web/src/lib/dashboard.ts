import { api } from './api';

export interface AdminStats {
  overview: {
    totalUsers: number;
    totalPartners: number;
    totalProducts: number;
    totalSales: number;
    totalRevenue: number;
    activeUsers: number;
    activePartners: number;
  };
  monthlyMetrics: {
    newUsers: number;
    newPartners: number;
    newProducts: number;
    sales: number;
    revenue: number;
  };
  growth: {
    userGrowthRate: number;
    partnerGrowthRate: number;
    userGrowthLastWeek: number;
    partnerGrowthLastWeek: number;
  };
  distributions: {
    productsByStatus: Record<string, number>;
    usersByRole: Record<string, number>;
  };
  topPartners: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
}

export interface PartnerStats {
  partner: {
    name: string;
    email: string;
    userCount: number;
  };
  overview: {
    totalProducts: number;
    availableProducts: number;
    soldProducts: number;
    reservedProducts: number;
    totalRevenue: number;
    averagePrice: number;
  };
  monthlyMetrics: {
    soldThisMonth: number;
    revenue: number;
    salesGrowth: number;
  };
  weeklyMetrics: {
    newProducts: number;
  };
  productDistribution: {
    byCategory: Record<string, number>;
    byCondition: Record<string, number>;
  };
  topSellingCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  recentSales: Array<{
    id: string;
    name: string;
    price: string;
    soldAt: string;
    image: string | null;
  }>;
}

export interface SalesData {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  dailySales: Record<string, { count: number; revenue: number }>;
  categorySales: Record<string, { count: number; revenue: number }>;
  salesTrend: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const response = await api.get('/api/admin/stats');
    return response.data.data;
  },

  async getUserStats(period: string = '30d') {
    const response = await api.get('/api/admin/users/stats', { params: { period } });
    return response.data.data;
  },

  async getPartnerStats() {
    const response = await api.get('/api/admin/partners/stats');
    return response.data.data;
  },

  async getProductStats() {
    const response = await api.get('/api/admin/products/stats');
    return response.data.data;
  },

  async getSalesStats(period: string = '30d'): Promise<SalesData> {
    const response = await api.get('/api/admin/sales/stats', { params: { period } });
    return response.data.data;
  }
};

export const dashboardService = {
  async getStats(): Promise<PartnerStats> {
    console.log('dashboardService.getStats - Making API request to /api/dashboard/stats');
    try {
      const response = await api.get('/api/dashboard/stats');
      console.log('dashboardService.getStats - API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      return response.data.data;
    } catch (error: any) {
      console.error('dashboardService.getStats - API error:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  async getSalesHistory(params: {
    period?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const response = await api.get('/api/dashboard/sales', { params });
    return response.data.data;
  },

  async getProductStats() {
    const response = await api.get('/api/dashboard/products/stats');
    return response.data.data;
  },

  async getCustomerInsights() {
    const response = await api.get('/api/dashboard/insights/customers');
    return response.data.data;
  }
};

export const databaseService = {
  async getStats() {
    const response = await api.get('/database/stats');
    return response.data.data;
  }
};