'use client';

import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Edit,
  Eye,
  Download,
  BarChart3,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Package,
  Truck,
  User,
  MapPin,
  CreditCard,
  FileText,
  Phone,
  Mail,
  Printer
} from 'lucide-react';
import { 
  orderService, 
  Order, 
  OrderFilters, 
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  formatOrderValue,
  formatOrderDate,
  formatOrderNumber,
  canUpdateOrderStatus,
  getNextValidStatuses,
  isOrderCancellable
} from '@/lib/api/order.service';
import { useAuth } from '@/contexts/auth-context';

const statusIcons = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
  REFUNDED: AlertTriangle
};

const OrderRow = memo(({ 
  order, 
  onSelect, 
  onEdit
}: {
  order: Order;
  onSelect: (order: Order) => void;
  onEdit: (order: Order) => void;
}) => {
  const StatusIcon = statusIcons[order.status];
  
  return (
    <TableRow 
      key={order.id}
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onSelect(order)}
      data-testid={`order-row-${order.orderNumber}`}
    >
      <TableCell className="font-mono text-sm">
        {formatOrderNumber(order.orderNumber)}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-sm text-gray-500">{order.customer.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          {order.items.map((item, index) => (
            <div key={item.id}>
              <p className="font-medium">{item.product.name}</p>
              {item.product.sku && (
                <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
              )}
              <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
              {index < order.items.length - 1 && <hr className="my-1" />}
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell className="font-semibold">
        {formatOrderValue(order.total)}
      </TableCell>
      <TableCell>
        <Badge 
          variant="outline" 
          className={ORDER_STATUS_COLORS[order.status]}
          data-testid={`order-status-${order.status}`}
        >
          <StatusIcon className="h-3 w-3 mr-1" />
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {formatOrderDate(order.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(order);
            }}
            data-testid={`view-order-${order.orderNumber}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(order);
            }}
            data-testid={`edit-order-${order.orderNumber}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

OrderRow.displayName = 'OrderRow';

function PedidosContent() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const loadOrders = async (isInitialLoad = false, filters: OrderFilters = {}) => {
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      setError(null);
      
      const params: OrderFilters = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter as OrderStatus;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (dateRange.start) {
        params.startDate = dateRange.start;
      }
      
      if (dateRange.end) {
        params.endDate = dateRange.end;
      }
      
      const data = await orderService.getOrders(params);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError('Erro ao carregar pedidos');
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setTableLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user?.partnerId) {
      loadOrders(true);
    }
  }, [user?.partnerId]);

  const applyFilters = async () => {
    if (user?.partnerId) {
      await loadOrders(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus, trackingCode?: string) => {
    const originalOrders = [...orders];
    const originalSelectedOrder = selectedOrder;
    const originalEditingOrder = editingOrder;
    
    try {
      setUpdatingStatus(true);
      
      // Optimistic update
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, trackingCode: trackingCode || order.trackingCode }
          : order
      );
      setOrders(updatedOrders);
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          trackingCode: trackingCode || selectedOrder.trackingCode
        });
      }
      
      if (editingOrder?.id === orderId) {
        setEditingOrder({
          ...editingOrder,
          status: newStatus,
          trackingCode: trackingCode || editingOrder.trackingCode
        });
      }
      
      // Make API call
      const updateData: any = { status: newStatus };
      if (trackingCode) {
        updateData.trackingCode = trackingCode;
      }
      
      await orderService.updateOrderStatus(orderId, updateData);
      
      // Send notification to customer
      await orderService.sendCustomerNotification(orderId, 'status_update');
      
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert('Erro ao atualizar status do pedido');
      
      // Rollback optimistic update
      setOrders(originalOrders);
      if (originalSelectedOrder) {
        setSelectedOrder(originalSelectedOrder);
      }
      if (originalEditingOrder) {
        setEditingOrder(originalEditingOrder);
      }
      
      setNeedsRefresh(true);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      setUpdatingStatus(true);
      
      await orderService.cancelOrder(orderId, { reason });
      
      // Refresh orders
      await loadOrders();
      
      // Close modals
      setSelectedOrder(null);
      setEditingOrder(null);
      
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert('Erro ao cancelar pedido');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (orderId: string, note: string) => {
    try {
      await orderService.addOrderNote(orderId, note);
      
      // Refresh order details
      const updatedOrder = await orderService.getOrderById(orderId);
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      
      if (editingOrder?.id === orderId) {
        setEditingOrder(updatedOrder);
      }
      
    } catch (err: any) {
      console.error('Error adding note:', err);
      alert('Erro ao adicionar nota');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.customer.name.toLowerCase().includes(query) ||
          order.customer.email.toLowerCase().includes(query) ||
          order.items.some(item => item.product.name.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [orders, searchQuery]);

  const formatDate = useCallback((dateString: string) => {
    return formatOrderDate(dateString);
  }, []);

  const formatPrice = useCallback((amount: number) => {
    return formatOrderValue(amount);
  }, []);

  const handleOrderSelect = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  const handleOrderEdit = useCallback((order: Order) => {
    setEditingOrder(order);
  }, []);

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      processing: orders.filter(o => o.status === 'PROCESSING').length,
      shipped: orders.filter(o => o.status === 'SHIPPED').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      totalRevenue: orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + o.total, 0)
    };
    return stats;
  };

  const stats = getOrderStats();

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando pedidos...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="orders-page-title">Pedidos</h1>
            <p className="text-gray-600 mt-2" data-testid="orders-page-description">
              Gerencie os pedidos do seu brechó e acompanhe as vendas
            </p>
          </div>
          <Button 
            onClick={() => loadOrders()} 
            variant="outline" 
            size="sm" 
            className="gap-2"
            data-testid="refresh-orders-button"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="total-orders-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900" data-testid="total-orders-count">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="pending-orders-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600" data-testid="pending-orders-count">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="delivered-orders-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entregues</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="delivered-orders-count">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="revenue-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-green-900" data-testid="total-revenue">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por número, cliente ou produto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="orders-search-input"
                  />
                </div>
              </div>
              
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value)}
                data-testid="orders-status-filter"
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="PROCESSING">Processando</SelectItem>
                  <SelectItem value="SHIPPED">Enviado</SelectItem>
                  <SelectItem value="DELIVERED">Entregue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={applyFilters} 
                disabled={tableLoading}
                size="sm"
                className="ml-2"
                data-testid="apply-filters-button"
              >
                {tableLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center text-gray-500 py-8" data-testid="no-orders-message">
                {orders.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum pedido corresponde aos filtros'}
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                {tableLoading && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Atualizando...</span>
                    </div>
                  </div>
                )}
                <Table data-testid="orders-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        onSelect={handleOrderSelect}
                        onEdit={handleOrderEdit}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Detail Modal */}
        <Dialog 
          open={!!selectedOrder} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedOrder(null);
              if (needsRefresh) {
                loadOrders();
                setNeedsRefresh(false);
              }
            }
          }}
        >
          <DialogContent className="max-w-4xl" data-testid="order-details-modal">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Número do Pedido</label>
                    <p className="font-mono text-lg" data-testid="order-number">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={ORDER_STATUS_COLORS[selectedOrder.status]}>
                        {ORDER_STATUS_LABELS[selectedOrder.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Valor Total</label>
                    <p className="text-lg font-semibold" data-testid="order-total">{formatPrice(selectedOrder.total)}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informações do Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome</label>
                      <p data-testid="customer-name">{selectedOrder.customer.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p data-testid="customer-email">{selectedOrder.customer.email}</p>
                    </div>
                    {selectedOrder.customer.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Telefone</label>
                        <p data-testid="customer-phone">{selectedOrder.customer.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Produtos
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium" data-testid={`product-name-${item.product.id}`}>{item.product.name}</p>
                          {item.product.sku && (
                            <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                          )}
                          <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                          <p className="text-sm text-gray-500">{formatPrice(item.unitPrice)} cada</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Endereço de Entrega
                  </h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p data-testid="shipping-address">
                      {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number}
                      {selectedOrder.shippingAddress.complement && `, ${selectedOrder.shippingAddress.complement}`}
                    </p>
                    <p>
                      {selectedOrder.shippingAddress.neighborhood} - {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                    </p>
                    <p>CEP: {selectedOrder.shippingAddress.zipCode}</p>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Informações de Pagamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Método</label>
                      <p data-testid="payment-method">{PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod || 'PIX']}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status do Pagamento</label>
                      <p data-testid="payment-status">{PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus]}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data do Pedido</label>
                      <p data-testid="order-date">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking */}
                {selectedOrder.trackingCode && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      Rastreamento
                    </h3>
                    <p className="font-mono" data-testid="tracking-code">{selectedOrder.trackingCode}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Observações
                    </h3>
                    <p className="text-gray-700" data-testid="order-notes">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.print()}
                    data-testid="print-order-button"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`mailto:${selectedOrder.customer.email}`)}
                    data-testid="contact-customer-email"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Cliente
                  </Button>
                  
                  {selectedOrder.customer.phone && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://wa.me/${selectedOrder.customer.phone.replace(/\D/g, '')}`)}
                      data-testid="contact-customer-whatsapp"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingOrder(selectedOrder)}
                    data-testid="edit-order-button"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Order Edit Modal */}
        <Dialog 
          open={!!editingOrder} 
          onOpenChange={(open) => {
            if (!open) {
              setEditingOrder(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl" data-testid="order-edit-modal">
            <DialogHeader>
              <DialogTitle>Editar Pedido #{editingOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            
            {editingOrder && (
              <div className="space-y-6">
                {/* Status Update */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Atualizar Status
                  </label>
                  <Select 
                    value={editingOrder.status}
                    onValueChange={(newStatus: OrderStatus) => 
                      handleStatusUpdate(editingOrder.id, newStatus)
                    }
                    disabled={updatingStatus}
                    data-testid="order-status-select"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getNextValidStatuses(editingOrder.status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updatingStatus && (
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </div>
                  )}
                </div>

                {/* Tracking Code */}
                {(editingOrder.status === 'SHIPPED' || editingOrder.trackingCode) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      Código de Rastreamento
                    </label>
                    <Input
                      value={editingOrder.trackingCode || ''}
                      onChange={(e) => setEditingOrder({
                        ...editingOrder,
                        trackingCode: e.target.value
                      })}
                      placeholder="Digite o código de rastreamento"
                      data-testid="tracking-code-input"
                    />
                    <Button
                      onClick={() => handleStatusUpdate(editingOrder.id, editingOrder.status, editingOrder.trackingCode || '')}
                      size="sm"
                      className="mt-2"
                      data-testid="update-tracking-button"
                    >
                      Atualizar Rastreamento
                    </Button>
                  </div>
                )}

                {/* Add Note */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Adicionar Observação
                  </label>
                  <Textarea
                    placeholder="Digite uma observação para este pedido..."
                    data-testid="order-note-textarea"
                  />
                  <Button
                    onClick={() => {
                      const textarea = document.querySelector('[data-testid="order-note-textarea"]') as HTMLTextAreaElement;
                      if (textarea?.value) {
                        handleAddNote(editingOrder.id, textarea.value);
                        textarea.value = '';
                      }
                    }}
                    size="sm"
                    className="mt-2"
                    data-testid="add-note-button"
                  >
                    Adicionar Nota
                  </Button>
                </div>

                {/* Cancel Order */}
                {isOrderCancellable(editingOrder.status) && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      Cancelar Pedido
                    </label>
                    <Textarea
                      placeholder="Motivo do cancelamento..."
                      data-testid="cancel-reason-textarea"
                    />
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const textarea = document.querySelector('[data-testid="cancel-reason-textarea"]') as HTMLTextAreaElement;
                        if (textarea?.value && confirm('Tem certeza que deseja cancelar este pedido?')) {
                          handleCancelOrder(editingOrder.id, textarea.value);
                        }
                      }}
                      size="sm"
                      className="mt-2"
                      data-testid="cancel-order-button"
                    >
                      Cancelar Pedido
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function PedidosPage() {
  return (
    <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'PARTNER_USER']}>
      <PedidosContent />
    </ProtectedRoute>
  );
}