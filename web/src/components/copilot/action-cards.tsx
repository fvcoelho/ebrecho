"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  FileText,
  UserPlus,
  RefreshCw
} from 'lucide-react';

interface ActionCardsProps {
  onSelectAction: (action: string) => void;
  variant?: 'default' | 'compact';
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  command: string;
  icon: React.ComponentType<any>;
  color: string;
  category: string;
}

const actionItems: ActionItem[] = [
  // Produtos
  {
    id: 'search-products',
    title: 'Buscar Produtos',
    description: 'Encontrar produtos no catálogo',
    command: 'Mostrar todos os produtos disponíveis',
    icon: Search,
    color: 'bg-blue-100 text-blue-600',
    category: 'products'
  },
  {
    id: 'add-product',
    title: 'Novo Produto',
    description: 'Cadastrar produto na loja',
    command: 'Quero cadastrar um novo produto',
    icon: Plus,
    color: 'bg-green-100 text-green-600',
    category: 'products'
  },
  {
    id: 'low-stock',
    title: 'Estoque Baixo',
    description: 'Produtos com estoque reduzido',
    command: 'Listar produtos com estoque baixo',
    icon: Package,
    color: 'bg-orange-100 text-orange-600',
    category: 'products'
  },

  // Vendas e Pedidos
  {
    id: 'recent-orders',
    title: 'Pedidos Recentes',
    description: 'Últimos pedidos realizados',
    command: 'Mostrar pedidos de hoje',
    icon: ShoppingCart,
    color: 'bg-purple-100 text-purple-600',
    category: 'orders'
  },
  {
    id: 'sales-report',
    title: 'Relatório de Vendas',
    description: 'Performance de vendas do período',
    command: 'Gerar relatório de vendas do último mês',
    icon: TrendingUp,
    color: 'bg-indigo-100 text-indigo-600',
    category: 'reports'
  },
  {
    id: 'revenue-analysis',
    title: 'Análise de Receita',
    description: 'Faturamento e margem',
    command: 'Analisar receita e lucratividade',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-600',
    category: 'reports'
  },

  // Clientes e Usuários
  {
    id: 'customer-list',
    title: 'Lista de Clientes',
    description: 'Clientes cadastrados',
    command: 'Mostrar meus clientes ativos',
    icon: Users,
    color: 'bg-cyan-100 text-cyan-600',
    category: 'customers'
  },
  {
    id: 'new-customer',
    title: 'Novo Cliente',
    description: 'Cadastrar cliente',
    command: 'Cadastrar um novo cliente',
    icon: UserPlus,
    color: 'bg-teal-100 text-teal-600',
    category: 'customers'
  },

  // Relatórios e Analytics
  {
    id: 'dashboard-summary',
    title: 'Dashboard',
    description: 'Resumo geral da loja',
    command: 'Mostrar dashboard com métricas principais',
    icon: BarChart3,
    color: 'bg-rose-100 text-rose-600',
    category: 'reports'
  },
  {
    id: 'inventory-report',
    title: 'Relatório de Estoque',
    description: 'Status do inventário',
    command: 'Gerar relatório completo do estoque',
    icon: FileText,
    color: 'bg-amber-100 text-amber-600',
    category: 'reports'
  },

  // Configurações
  {
    id: 'store-settings',
    title: 'Configurações',
    description: 'Configurar loja e perfil',
    command: 'Mostrar configurações da minha loja',
    icon: Settings,
    color: 'bg-gray-100 text-gray-600',
    category: 'settings'
  },
  {
    id: 'sync-data',
    title: 'Sincronizar Dados',
    description: 'Atualizar informações',
    command: 'Sincronizar dados da loja com sistema',
    icon: RefreshCw,
    color: 'bg-slate-100 text-slate-600',
    category: 'settings'
  }
];

export function ActionCards({ onSelectAction, variant = 'default' }: ActionCardsProps) {
  const handleActionClick = (command: string) => {
    onSelectAction(command);
  };

  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {actionItems.slice(0, 8).map((action) => (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={() => handleActionClick(action.command)}
            className="flex items-center justify-start h-auto p-3 text-left"
          >
            <action.icon className={`h-4 w-4 mr-2 ${action.color.split(' ')[1]}`} />
            <span className="text-xs font-medium truncate">
              {action.title}
            </span>
          </Button>
        ))}
      </div>
    );
  }

  // Agrupar ações por categoria
  const groupedActions = actionItems.reduce((groups, action) => {
    if (!groups[action.category]) {
      groups[action.category] = [];
    }
    groups[action.category].push(action);
    return groups;
  }, {} as Record<string, ActionItem[]>);

  const categoryNames: Record<string, string> = {
    products: '🛍️ Produtos',
    orders: '📦 Pedidos',
    customers: '👥 Clientes',
    reports: '📊 Relatórios',
    settings: '⚙️ Configurações'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedActions).map(([category, actions]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {categoryNames[category] || category}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actions.map((action) => (
              <Card 
                key={action.id}
                className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 hover:border-gray-300"
                onClick={() => handleActionClick(action.command)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm text-gray-900 mb-1">
                        {action.title}
                      </h5>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Sugestões personalizadas */}
      <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <h4 className="text-sm font-semibold text-indigo-900 mb-3">
          💡 Sugestões Personalizadas
        </h4>
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActionClick('Como está a performance da minha loja hoje?')}
            className="w-full justify-start text-indigo-700 hover:bg-indigo-100"
          >
            "Como está a performance da minha loja hoje?"
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActionClick('Quais produtos estão vendendo mais este mês?')}
            className="w-full justify-start text-indigo-700 hover:bg-indigo-100"
          >
            "Quais produtos estão vendendo mais este mês?"
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActionClick('Preciso atualizar preços para Black Friday')}
            className="w-full justify-start text-indigo-700 hover:bg-indigo-100"
          >
            "Preciso atualizar preços para Black Friday"
          </Button>
        </div>
      </div>
    </div>
  );
}