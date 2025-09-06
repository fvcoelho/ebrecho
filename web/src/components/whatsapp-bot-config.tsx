'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge,
  Alert,
  AlertDescription,
  Switch,
  Label
} from '@/components/ui';
import { MessageCircle, QrCode, CheckCircle2, AlertCircle, RefreshCw, Power, Settings } from 'lucide-react';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import { api } from '@/lib/api';

interface WhatsAppBotStatus {
  botEnabled: boolean;
  connectionStatus: string;
  instanceId?: string;
  whatsappNumber?: string;
  evolutionState?: string;
  qrcode?: string;
}

interface WhatsAppBotConfigProps {
  partnerId: string;
  whatsappNumber?: string;
  onBotStatusChange?: (enabled: boolean) => void;
}

export function WhatsAppBotConfig({ partnerId, whatsappNumber, onBotStatusChange }: WhatsAppBotConfigProps) {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsAppBotStatus>({
    botEnabled: false,
    connectionStatus: 'disconnected'
  });

  useEffect(() => {
    if (partnerId) {
      loadBotStatus();
      // Poll status every 10 seconds if bot is enabled
      const interval = setInterval(() => {
        if (status.botEnabled) {
          loadBotStatus();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [partnerId, status.botEnabled]);

  const loadBotStatus = async () => {
    try {
      setStatusLoading(true);
      setError(null);
      
      const response = await api.get(`/api/partners/${partnerId}/whatsapp-bot/status`);
      
      if (response.data.success) {
        const statusData = response.data.data;
        console.log('Bot status received:', {
          botEnabled: statusData.botEnabled,
          connectionStatus: statusData.connectionStatus,
          evolutionState: statusData.evolutionState,
          instanceId: statusData.instanceId
        });
        setStatus(statusData);
      } else {
        setError(response.data.error || 'Erro ao carregar status do bot');
      }
    } catch (err: any) {
      console.error('Error loading bot status:', err);
      setError(err.response?.data?.error || 'Erro ao carregar status do bot');
    } finally {
      setStatusLoading(false);
    }
  };

  const enableBot = async () => {
    if (!whatsappNumber) {
      setError('Configure o número do WhatsApp nas configurações da loja primeiro');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/api/partners/${partnerId}/whatsapp-bot/enable`);
      
      if (response.data.success) {
        setStatus(response.data.data);
        setSuccess('WhatsApp Bot habilitado! Escaneie o QR code para conectar.');
        onBotStatusChange?.(true);
      } else {
        setError(response.data.error || 'Erro ao habilitar bot');
      }
    } catch (err: any) {
      console.error('Error enabling bot:', err);
      setError(err.response?.data?.error || 'Erro ao habilitar WhatsApp Bot');
    } finally {
      setLoading(false);
    }
  };

  const disableBot = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/api/partners/${partnerId}/whatsapp-bot/disable`);
      
      if (response.data.success) {
        setStatus({
          botEnabled: false,
          connectionStatus: 'disconnected'
        });
        setSuccess('WhatsApp Bot desabilitado com sucesso.');
        onBotStatusChange?.(false);
      } else {
        setError(response.data.error || 'Erro ao desabilitar bot');
      }
    } catch (err: any) {
      console.error('Error disabling bot:', err);
      setError(err.response?.data?.error || 'Erro ao desabilitar WhatsApp Bot');
    } finally {
      setLoading(false);
    }
  };

  const restartBot = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/api/partners/${partnerId}/whatsapp-bot/restart`);
      
      if (response.data.success) {
        setSuccess('Bot reiniciado com sucesso. Aguarde a reconexão.');
        setTimeout(loadBotStatus, 2000);
      } else {
        setError(response.data.error || 'Erro ao reiniciar bot');
      }
    } catch (err: any) {
      console.error('Error restarting bot:', err);
      setError(err.response?.data?.error || 'Erro ao reiniciar WhatsApp Bot');
    } finally {
      setLoading(false);
    }
  };

  const getQRCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/partners/${partnerId}/whatsapp-bot/qrcode`);
      
      if (response.data.success) {
        setStatus(prev => ({
          ...prev,
          qrcode: response.data.data.qrcode
        }));
      } else {
        setError(response.data.error || 'Erro ao obter QR code');
      }
    } catch (err: any) {
      console.error('Error getting QR code:', err);
      setError(err.response?.data?.error || 'Erro ao obter QR code');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (connectionStatus: string) => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 border-green-600';
      case 'connecting':
        return 'text-yellow-600 border-yellow-600';
      case 'disconnected':
      default:
        return 'text-gray-600 border-gray-600';
    }
  };

  const getStatusIcon = (connectionStatus: string) => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'disconnected':
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (connectionStatus: string) => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'disconnected':
      default:
        return 'Desconectado';
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
            WhatsApp Bot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <SpinningLogo size="lg" speed="normal" />
            <span className="ml-2 text-gray-600">Carregando status do bot...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
            WhatsApp Bot
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={status.botEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  enableBot();
                } else {
                  disableBot();
                }
              }}
              disabled={loading}
            />
            <Label>Bot Ativo</Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {!whatsappNumber && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Configure o número do WhatsApp nas configurações da loja para habilitar o bot.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status da Conexão</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(status.connectionStatus)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(status.connectionStatus)}
                  {getStatusText(status.connectionStatus)}
                </div>
              </Badge>
              {status.evolutionState && status.evolutionState !== status.connectionStatus && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  Evolution: {status.evolutionState}
                </Badge>
              )}
              {status.instanceId && (
                <Badge variant="outline" className="text-xs">
                  ID: {status.instanceId}
                </Badge>
              )}
            </div>
          </div>
          
          {status.botEnabled && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadBotStatus}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {status.connectionStatus !== 'connected' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getQRCode}
                  disabled={loading}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  QR Code
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={restartBot}
                disabled={loading}
              >
                <Power className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {status.qrcode && status.connectionStatus !== 'connected' && (
          <div className="flex flex-col items-center space-y-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 text-center mb-2">
              Escaneie o QR Code com o WhatsApp para conectar:
            </p>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <img 
                src={`data:image/png;base64,${status.qrcode}`} 
                alt="QR Code WhatsApp"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Abra o WhatsApp → Menu (3 pontos) → Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        )}

        {status.botEnabled && status.connectionStatus === 'connected' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span>WhatsApp Bot está conectado e funcionando!</span>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/dashboard/bot-config', '_blank')}
                  className="ml-2"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar Mensagens
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {status.botEnabled && whatsappNumber && (
          <div className="text-sm text-gray-600">
            <p><strong>WhatsApp:</strong> {whatsappNumber}</p>
            {/* {status.instanceId && <p><strong>Instância:</strong> {status.instanceId}</p>} */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}