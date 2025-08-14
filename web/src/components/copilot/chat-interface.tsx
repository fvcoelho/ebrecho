"use client";

import { useState, useRef, useEffect } from 'react';
import { useCopilot } from '@/lib/copilot/use-copilot';
import { MessageRenderer } from './message-renderer';
import { ActionCards } from './action-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  ArrowLeft, 
  Bot, 
  User, 
  Loader2, 
  RefreshCw, 
  Settings,
  Zap
} from 'lucide-react';

interface ChatInterfaceProps {
  onClose: () => void;
}

export function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    connectionStatus,
    sendMessage,
    clearConversation,
    retryLastMessage
  } = useCopilot();

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Foco no input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Monitor de conexão com debug
  useEffect(() => {
    console.log('🔍 Chat Interface Debug - Connection Status:', connectionStatus);
    setIsConnected(connectionStatus === 'connected');
  }, [connectionStatus]);

  // Debug auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔍 Chat Interface Debug - Auth State:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasUser: !!user,
      userData: user ? JSON.parse(user) : null,
      isLoading,
      isStreaming,
      connectionStatus
    });
  }, [isLoading, isStreaming, connectionStatus]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    
    console.log('🔍 Chat Interface Debug - Sending message:', message);
    console.log('🔍 Chat Interface Debug - Pre-send state:', {
      isLoading,
      isStreaming,
      connectionStatus,
      hasToken: !!localStorage.getItem('token')
    });
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.error('❌ Chat Interface Error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (action: string) => {
    setInput(action);
    await sendMessage(action);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Bot className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Copilot eBrecho
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={isConnected ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                    {isStreaming && (
                      <Badge variant="outline" className="text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processando...
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                disabled={messages.length === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Chat Principal */}
        <div className="flex-1 flex flex-col">
          {/* Mensagens */}
          <div className="flex-1 px-4 overflow-y-auto">
            <div className="py-6 space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Como posso te ajudar hoje?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Digite sua pergunta ou use uma das ações rápidas abaixo.
                    Posso ajudar com produtos, pedidos, clientes e muito mais!
                  </p>
                  
                  <ActionCards onSelectAction={handleQuickAction} />
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <MessageRenderer key={index} message={message} />
                  ))}
                  
                  {isStreaming && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Bot className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="bg-white border rounded-lg p-4 max-w-3xl">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                          <span className="text-sm text-gray-600">
                            Processando sua solicitação...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t bg-white px-4 py-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 border rounded-lg bg-white">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua pergunta ou comando..."
                    disabled={isLoading || !isConnected}
                    className="flex-1 border-0 focus:ring-0 text-base"
                    maxLength={500}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || !isConnected}
                    className="m-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Pressione Enter para enviar, Shift+Enter para nova linha
                  </p>
                  <span className="text-xs text-gray-400">
                    {input.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Ações rápidas quando há mensagens */}
            {messages.length > 0 && (
              <div className="mt-4">
                <Separator className="mb-4" />
                <ActionCards 
                  onSelectAction={handleQuickAction}
                  variant="compact"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Informações) */}
        <div className="w-80 border-l bg-white">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Status da Sessão
            </h3>
            
            {/* Debug Panel */}
            <Card className="mb-4 bg-yellow-50 border-yellow-200">
              <CardContent className="p-3">
                <h4 className="text-xs font-bold text-yellow-800 mb-2">🔧 DEBUG INFO</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Token:</span>
                    <span className={typeof window !== 'undefined' && localStorage.getItem('token') ? 'text-green-600' : 'text-red-600'}>
                      {typeof window !== 'undefined' && localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className={typeof window !== 'undefined' && localStorage.getItem('user') ? 'text-green-600' : 'text-red-600'}>
                      {typeof window !== 'undefined' && localStorage.getItem('user') ? '✅ Present' : '❌ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <span>{isLoading ? '⏳ Yes' : '✅ No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Streaming:</span>
                    <span>{isStreaming ? '🔄 Yes' : '✅ No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conexão:</span>
                    <Badge variant={isConnected ? "default" : "destructive"}>
                      {isConnected ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mensagens:</span>
                    <span className="text-sm font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Modelo IA:</span>
                    <span className="text-sm font-medium">Claude 3.5 Sonnet</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Dicas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use linguagem natural em português</li>
                  <li>• Seja específico com números e datas</li>
                  <li>• Mencione IDs quando necessário</li>
                  <li>• Pergunte sobre múltiplas operações</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}