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
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Edit,
  Download,
  BarChart3,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { pixTransactionService, PixTransaction, ListPixTransactionsParams } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-purple-100 text-purple-800 border-purple-200'
};

const statusLabels = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado'
};

const statusIcons = {
  PENDING: Clock,
  PAID: CheckCircle,
  EXPIRED: XCircle,
  CANCELLED: XCircle,
  REFUNDED: AlertTriangle
};

const TransactionRow = memo(({ 
  transaction, 
  onSelect, 
  formatPrice, 
  formatDate 
}: {
  transaction: any;
  onSelect: (transaction: any) => void;
  formatPrice: (amount: number) => string;
  formatDate: (dateString: string) => string;
}) => {
  const StatusIcon = statusIcons[transaction.status];
  
  return (
    <TableRow 
      key={transaction.id}
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onSelect(transaction)}
    >
      <TableCell className="font-mono text-sm">
        {transaction.transactionCode}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{transaction.product?.name || 'N/A'}</p>
          {transaction.product?.sku && (
            <p className="text-sm text-gray-500">SKU: {transaction.product.sku}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="font-semibold">
        {formatPrice(transaction.amount)}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={statusColors[transaction.status]}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusLabels[transaction.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {transaction.customerEmail || 'N/A'}
      </TableCell>
      <TableCell className="text-sm">
        {formatDate(transaction.createdAt)}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(transaction);
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

TransactionRow.displayName = 'TransactionRow';

function VendasContent() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PixTransaction[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<PixTransaction | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const loadTransactions = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      setError(null);
      
      const params: ListPixTransactionsParams = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter as any;
      }
      
      const data = await pixTransactionService.listPartnerPixTransactions(params);
      setTransactions(data);
    } catch (err: any) {
      console.error('Error loading PIX transactions:', err);
      setError('Erro ao carregar transações PIX');
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
      loadTransactions(true);
    }
  }, [user?.partnerId]);

  const applyFilters = async () => {
    if (user?.partnerId) {
      await loadTransactions();
    }
  };

  const handleStatusUpdate = async (transactionCode: string, newStatus: string) => {
    // Store original state for potential rollback
    const originalTransactions = [...transactions];
    const originalSelectedTransaction = selectedTransaction;
    
    try {
      setUpdatingStatus(true);
      
      // Optimistic update: immediately update both the table and modal
      const updatedTransactions = transactions.map(t => 
        t.transactionCode === transactionCode 
          ? { ...t, status: newStatus as any }
          : t
      );
      setTransactions(updatedTransactions);
      
      if (selectedTransaction?.transactionCode === transactionCode) {
        setSelectedTransaction({
          ...selectedTransaction,
          status: newStatus as any
        });
      }
      
      // Make API call
      await pixTransactionService.updatePixTransactionStatus(transactionCode, {
        status: newStatus as any
      });
      
    } catch (err: any) {
      console.error('Error updating transaction status:', err);
      alert('Erro ao atualizar status da transação');
      
      // Rollback optimistic update on error
      setTransactions(originalTransactions);
      if (originalSelectedTransaction) {
        setSelectedTransaction(originalSelectedTransaction);
      }
      
      // Mark that we need a refresh when modal closes to get accurate data
      setNeedsRefresh(true);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          transaction.transactionCode.toLowerCase().includes(query) ||
          transaction.product?.name.toLowerCase().includes(query) ||
          transaction.customerEmail?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [transactions, searchQuery]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  }, []);

  const formatPrice = useCallback((amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  }, []);

  const handleTransactionSelect = useCallback((transaction: any) => {
    setSelectedTransaction(transaction);
  }, []);

  const getStatusStats = () => {
    const stats = {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'PENDING').length,
      paid: transactions.filter(t => t.status === 'PAID').length,
      expired: transactions.filter(t => t.status === 'EXPIRED').length,
      totalRevenue: transactions
        .filter(t => t.status === 'PAID')
        .reduce((sum, t) => sum + t.amount, 0)
    };
    return stats;
  };

  const stats = getStatusStats();

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando transações...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Vendas PIX</h1>
            <p className="text-gray-600 mt-2">
              Gerencie suas transações PIX e acompanhe os pagamentos
            </p>
          </div>
          <Button onClick={loadTransactions} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-green-900">{formatPrice(stats.totalRevenue)}</p>
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
                    placeholder="Buscar por código, produto ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                // Don't trigger immediate reload, let user finish selecting
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={applyFilters} 
                disabled={tableLoading}
                size="sm"
                className="ml-2"
              >
                {tableLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações PIX</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {transactions.length === 0 ? 'Nenhuma transação encontrada' : 'Nenhuma transação corresponde aos filtros'}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onSelect={handleTransactionSelect}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Detail Modal */}
        <Dialog open={!!selectedTransaction} onOpenChange={(open) => {
          if (!open) {
            setSelectedTransaction(null);
            // Only refresh if explicitly needed (e.g., after an error or external change)
            if (needsRefresh) {
              loadTransactions();
              setNeedsRefresh(false);
            }
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Transação</DialogTitle>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Código da Transação</label>
                    <p className="font-mono text-sm">{selectedTransaction.transactionCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status Atual</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={statusColors[selectedTransaction.status]}>
                        {statusLabels[selectedTransaction.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Produto</label>
                    <p>{selectedTransaction.product?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Valor</label>
                    <p className="font-semibold">{formatPrice(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cliente</label>
                    <p>{selectedTransaction.customerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                    <p>{formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                </div>

                {/* Status Update */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Atualizar Status
                  </label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedTransaction.status}
                      onValueChange={(newStatus) => 
                        handleStatusUpdate(selectedTransaction.transactionCode, newStatus)
                      }
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="PAID">Pago</SelectItem>
                        <SelectItem value="EXPIRED">Expirado</SelectItem>
                        <SelectItem value="CANCELLED">Cancelado</SelectItem>
                        <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingStatus && (
                      <div className="flex items-center text-sm text-gray-500">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Atualizando...
                      </div>
                    )}
                  </div>
                </div>

                {/* PIX Details */}
                {selectedTransaction.pixKey && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      Detalhes PIX
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm"><strong>Chave PIX:</strong> {selectedTransaction.pixKey}</p>
                      <p className="text-sm"><strong>Loja:</strong> {selectedTransaction.merchantName}</p>
                      <p className="text-sm"><strong>Cidade:</strong> {selectedTransaction.merchantCity}</p>
                    </div>
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

export default function VendasPage() {
  return (
    <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'PARTNER_USER']}>
      <VendasContent />
    </ProtectedRoute>
  );
}