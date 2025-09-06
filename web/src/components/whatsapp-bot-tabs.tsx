'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppBotConfig } from '@/components/whatsapp-bot-config';
import { WhatsAppChatTest } from '@/components/whatsapp-chat-test';
import { BotConfiguration } from '@/components/dashboard/bot-configuration';
import { 
  MessageCircle, 
  Settings, 
  TestTube,
  Bot,
  Wifi,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

interface WhatsAppBotTabsProps {
  partnerId: string;
  whatsappNumber?: string;
  slug: string;
  aiInstructions?: string;
}

export function WhatsAppBotTabs({ 
  partnerId, 
  whatsappNumber, 
  slug,
  aiInstructions 
}: WhatsAppBotTabsProps) {
  const [activeTab, setActiveTab] = useState('connection');
  const [botStatus, setBotStatus] = useState({
    enabled: false,
    connected: false,
    instanceId: '',
    connectionStatus: 'disconnected'
  });
  const [loading, setLoading] = useState(true);

  // Load initial bot status
  useEffect(() => {
    loadBotStatus();
    // Poll for status updates every 5 seconds when bot is enabled but not connected
    const interval = setInterval(() => {
      if (botStatus.enabled && !botStatus.connected) {
        loadBotStatus();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [partnerId, botStatus.enabled, botStatus.connected]);

  const loadBotStatus = async () => {
    try {
      const response = await api.get(`/api/partners/${partnerId}/whatsapp-bot/status`);
      if (response.data.success) {
        const status = response.data.data;
        setBotStatus({
          enabled: status.botEnabled,
          connected: status.connectionStatus === 'connected' || status.connectionStatus === 'conectado',
          instanceId: status.instanceId || '',
          connectionStatus: status.connectionStatus || 'disconnected'
        });
      }
    } catch (error) {
      console.error('Error loading bot status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBotStatusChange = (enabled: boolean) => {
    // Reload status when bot status changes
    loadBotStatus();
  };

  // Check if tabs should be disabled
  const isTabDisabled = !botStatus.connected || botStatus.connectionStatus !== 'connected';

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => {
        // Only allow tab change if connection tab or if connected
        if (value === 'connection' || !isTabDisabled) {
          setActiveTab(value);
        }
      }} 
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="connection" className="flex items-center gap-2">
          <Wifi className={`h-4 w-4 ${botStatus.connected ? 'text-green-600' : ''}`} />
          <span className="hidden sm:inline">Conexão</span>
        </TabsTrigger>
        <TabsTrigger 
          value="test" 
          className={`flex items-center gap-2 ${isTabDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isTabDisabled}
        >
          <TestTube className="h-4 w-4" />
          <span className="hidden sm:inline">Testar Chat</span>
        </TabsTrigger>
        <TabsTrigger 
          value="config" 
          className={`flex items-center gap-2 ${isTabDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isTabDisabled}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configurações</span>
        </TabsTrigger>
        <TabsTrigger 
          value="templates" 
          className={`flex items-center gap-2 ${isTabDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isTabDisabled}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="connection" className="space-y-4">
        <WhatsAppBotConfig
          partnerId={partnerId}
          whatsappNumber={whatsappNumber}
          onBotStatusChange={(enabled) => handleBotStatusChange(enabled)}
        />
      </TabsContent>

      <TabsContent value="test" className="space-y-4">
        <WhatsAppChatTest
          partnerId={partnerId}
          instanceId={botStatus.instanceId}
          whatsappNumber={whatsappNumber}
        />
      </TabsContent>

      <TabsContent value="config" className="space-y-4">
        <BotConfiguration
          partnerId={partnerId}
          slug={slug}
          initialInstructions={aiInstructions}
        />
      </TabsContent>

      <TabsContent value="templates" className="space-y-4">
        <MessageTemplates partnerId={partnerId} />
      </TabsContent>
    </Tabs>
  );
}

// Message Templates Component
function MessageTemplates({ partnerId }: { partnerId: string }) {
  const templates = [
    {
      category: 'Saudações',
      items: [
        { name: 'Boas-vindas', message: 'Olá! 👋 Bem-vindo ao nosso atendimento!' },
        { name: 'Despedida', message: 'Obrigado pelo contato! Até breve! 😊' }
      ]
    },
    {
      category: 'Produtos',
      items: [
        { name: 'Disponibilidade', message: 'Este produto está disponível. Gostaria de reservá-lo?' },
        { name: 'Informações', message: 'Claro! Vou buscar as informações deste produto para você.' }
      ]
    },
    {
      category: 'Pedidos',
      items: [
        { name: 'Status', message: 'Vou verificar o status do seu pedido. Um momento.' },
        { name: 'Confirmação', message: 'Seu pedido foi confirmado com sucesso!' }
      ]
    },
    {
      category: 'Atendimento',
      items: [
        { name: 'Horário', message: 'Nosso horário de atendimento é de segunda a sexta das 9h às 18h.' },
        { name: 'Localização', message: 'Estamos localizados em [ENDEREÇO]. Como chegar: [LINK_MAPS]' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Templates de Mensagem
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Templates pré-definidos para respostas rápidas e consistentes
        </p>

        <div className="space-y-6">
          {templates.map((category) => (
            <div key={category.category}>
              <h4 className="font-medium text-gray-900 mb-3">{category.category}</h4>
              <div className="grid gap-3">
                {category.items.map((template) => (
                  <div
                    key={template.name}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 mb-1">
                          {template.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {template.message}
                        </p>
                      </div>
                      <button className="ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button className="mt-6 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors">
          + Adicionar Template
        </button>
      </div>
    </div>
  );
}