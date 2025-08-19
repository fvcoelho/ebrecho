'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui';
import { 
  Users, 
  Store, 
  Settings, 
  BarChart3, 
  Menu, 
  X,
  Home,
  UserCheck,
  ShoppingBag,
  Shield,
  UserPlus,
  Calendar,
  TrendingUp,
  Gift
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  { icon: Home, label: 'Visão Geral', href: '/admin' },
  { icon: Users, label: 'Usuários', href: '/admin/usuarios' },
  { icon: Store, label: 'Parceiros', href: '/admin/parceiros' },
  { icon: ShoppingBag, label: 'Brechós', href: '/admin/brechos' },
  { icon: BarChart3, label: 'Análises', href: '/admin/analytics' },
  { icon: Shield, label: 'Moderação', href: '/admin/moderacao' },
  { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
];

const storeOwnerNavItems = [
  { icon: Home, label: 'Meu Brechó', href: '/dashboard' },
  { icon: ShoppingBag, label: 'Produtos', href: '/produtos' },
  { icon: ShoppingBag, label: 'Pedidos', href: '/dashboard/pedidos' },
  { icon: BarChart3, label: 'Vendas', href: '/vendas' },
  { icon: TrendingUp, label: 'Análises', href: '/dashboard/analytics' },
  { icon: Users, label: 'Clientes', href: '/dashboard/clientes' },
  { icon: Settings, label:'Configurações', href: '/dashboard/configuracoes' },
];

const promoterNavItems = [
  { icon: Home, label: 'Painel Geral', href: '/promoter-dashboard' },
  { icon: UserPlus, label: 'Convidar Parceiros', href: '/promoter-dashboard/convites' },
  { icon: Users, label: 'Meus Parceiros', href: '/promoter-dashboard/parceiros' },
  { icon: Calendar, label: 'Eventos', href: '/promoter-dashboard/eventos' },
  { icon: TrendingUp, label: 'Comissões', href: '/promoter-dashboard/comissoes' },
  { icon: BarChart3, label: 'Relatórios', href: '/promoter-dashboard/relatorios' },
  { icon: Gift, label: 'Recompensas', href: '/promoter-dashboard/recompensas' },
  { icon: Settings, label: 'Configurações', href: '/promoter-dashboard/configuracoes' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const getNavItems = () => {
    if (user?.role === 'ADMIN') return adminNavItems;
    if (user?.role === 'PROMOTER' || user?.role === 'PARTNER_PROMOTER') return promoterNavItems;
    return storeOwnerNavItems;
  };
  
  const getDashboardTitle = () => {
    if (user?.role === 'ADMIN') return 'Admin Dashboard';
    if (user?.role === 'PROMOTER' || user?.role === 'PARTNER_PROMOTER') return 'Painel do Promotor';
    return 'Painel do Brechó';
  };
  
  const navItems = getNavItems();
  const dashboardTitle = getDashboardTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:w-64 lg:h-screen
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">{dashboardTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">Bem-vindo, {user?.name}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* User actions */}
          <div className="p-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 uppercase">
                    {user?.role}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <main className="p-6 h-full">
          {children}
        </main>
      </div>
    </div>
  );
}