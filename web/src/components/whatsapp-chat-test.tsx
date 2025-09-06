'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@/components/ui';
import { 
  Send, 
  Bot, 
  User, 
  Phone,
  Image,
  FileText,
  Loader2,
  CheckCheck,
  Check,
  AlertCircle,
  MoreVertical,
  Paperclip
} from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  mediaType?: 'text' | 'image' | 'document';
  mediaUrl?: string;
}

interface WhatsAppChatTestProps {
  partnerId: string;
  instanceId?: string;
  whatsappNumber?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  category: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Mensagem de Boas-vindas',
    message: 'Olá! 👋 Bem-vindo ao nosso atendimento via WhatsApp! Como posso ajudá-lo hoje?',
    category: 'Geral'
  },
  {
    id: 'product-inquiry',
    name: 'Consulta de Produto',
    message: 'Gostaria de saber mais sobre algum produto específico? Por favor, me envie o código ou nome do produto.',
    category: 'Produtos'
  },
  {
    id: 'availability',
    name: 'Disponibilidade',
    message: 'Este produto está disponível em nossa loja. Gostaria de reservá-lo?',
    category: 'Produtos'
  },
  {
    id: 'order-status',
    name: 'Status do Pedido',
    message: 'Por favor, me informe o número do seu pedido para que eu possa verificar o status.',
    category: 'Pedidos'
  },
  {
    id: 'payment-info',
    name: 'Informações de Pagamento',
    message: 'Aceitamos PIX, cartão de crédito e débito. Qual forma de pagamento você prefere?',
    category: 'Pagamento'
  },
  {
    id: 'store-hours',
    name: 'Horário de Funcionamento',
    message: 'Nosso horário de atendimento é de segunda a sexta das 9h às 18h, e sábados das 9h às 13h.',
    category: 'Atendimento'
  },
  {
    id: 'location',
    name: 'Localização',
    message: 'Nossa loja está localizada em [ENDEREÇO]. Posso ajudar com mais alguma informação?',
    category: 'Atendimento'
  },
  {
    id: 'thank-you',
    name: 'Agradecimento',
    message: 'Muito obrigado pelo contato! Foi um prazer atendê-lo. Volte sempre! 😊',
    category: 'Geral'
  }
];

export function WhatsAppChatTest({ partnerId, instanceId, whatsappNumber }: WhatsAppChatTestProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check connection status
  useEffect(() => {
    checkConnectionStatus();
  }, [partnerId]);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get(`/api/partners/${partnerId}/whatsapp-bot/status`);
      if (response.data.success) {
        setIsConnected(response.data.data.connectionStatus === 'connected');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      setError('Por favor, digite uma mensagem');
      return;
    }

    if (!testPhoneNumber && isConnected) {
      setError('Por favor, insira um número de telefone para enviar mensagem real');
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      status: isConnected ? 'sending' : 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    const messageText = inputMessage;
    setInputMessage('');
    setError(null);

    if (isConnected && testPhoneNumber) {
      // Send real message via WhatsApp
      try {
        setLoading(true);

        // Try to send typing indicator (optional, don't fail if it doesn't work)
        try {
          await api.post(`/api/partners/${partnerId}/whatsapp-bot/send-typing`, {
            to: testPhoneNumber,
            duration: 2000
          });
          // Wait a bit to simulate typing
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (typingError) {
          console.warn('Typing indicator failed, continuing without it:', typingError);
          // Continue without typing indicator
        }

        // Send the actual message
        const response = await api.post(`/api/partners/${partnerId}/whatsapp-bot/test-message`, {
          to: testPhoneNumber,
          message: messageText,
          messageType: 'text'
        });

        if (response.data.success) {
          // Update message status to sent
          setMessages(prev => 
            prev.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, status: 'sent' } 
                : msg
            )
          );

          // Simulate delivery after 1 second
          setTimeout(() => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === newMessage.id 
                  ? { ...msg, status: 'delivered' } 
                  : msg
              )
            );
          }, 1000);

          // Simulate read after 2 seconds
          setTimeout(() => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === newMessage.id 
                  ? { ...msg, status: 'read' } 
                  : msg
              )
            );
          }, 2000);

        } else {
          throw new Error(response.data.error || 'Erro ao enviar mensagem');
        }
      } catch (err: any) {
        console.error('Error sending message:', err);
        setError(err.response?.data?.error || 'Erro ao enviar mensagem');
        
        // Update message status to error
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'error' } 
              : msg
          )
        );
      } finally {
        setLoading(false);
      }
    }

    // Always simulate bot response for demo purposes
    setTimeout(() => {
      simulateBotResponse(messageText);
    }, isConnected ? 3000 : 2000);
  };

  const simulateBotResponse = (userMessage: string) => {
    setIsTyping(true);
    
    // Generate contextual response based on user message
    const generateResponse = (message: string): string => {
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('produto') || lowerMsg.includes('item')) {
        return '🛍️ Claro! Temos uma grande variedade de produtos disponíveis. Que tipo de peça você está procurando? Vestidos, camisetas, calças, sapatos? Posso ajudá-lo a encontrar o que deseja!';
      } else if (lowerMsg.includes('preço') || lowerMsg.includes('valor') || lowerMsg.includes('cust')) {
        return '💰 Nossos preços são super acessíveis! Temos peças a partir de R$ 15,00. Você pode conferir todos os produtos e preços no nosso catálogo. Qual produto específico te interessa?';
      } else if (lowerMsg.includes('horário') || lowerMsg.includes('funcionamento')) {
        return '🕒 Nosso horário de atendimento é:\n• Segunda a sexta: 9h às 18h\n• Sábados: 9h às 13h\n• Domingos: fechado\n\nEstamos sempre prontos para atendê-lo!';
      } else if (lowerMsg.includes('localização') || lowerMsg.includes('endereço') || lowerMsg.includes('onde')) {
        return '📍 Nossa loja fica localizada em [ENDEREÇO DA LOJA]. Estamos bem no centro da cidade, fácil de chegar! Quer que eu envie a localização no mapa?';
      } else if (lowerMsg.includes('entrega') || lowerMsg.includes('frete')) {
        return '🚚 Fazemos entregas sim! \n• Entrega local: R$ 8,00\n• Frete para outras cidades via Correios\n• Acima de R$ 80,00 a entrega local é grátis!\n\nQuer fazer um pedido?';
      } else if (lowerMsg.includes('pagamento') || lowerMsg.includes('pagar')) {
        return '💳 Aceitamos várias formas de pagamento:\n• PIX (5% desconto)\n• Cartão de crédito e débito\n• Dinheiro\n• Transferência bancária\n\nQual você prefere?';
      } else if (lowerMsg.includes('ola') || lowerMsg.includes('olá') || lowerMsg.includes('oi')) {
        return '👋 Olá! Seja muito bem-vindo(a) ao nosso atendimento! Sou o assistente virtual da loja e estou aqui para ajudá-lo com qualquer dúvida sobre nossos produtos, preços, horários e muito mais. Como posso ajudá-lo hoje?';
      } else if (lowerMsg.includes('obrigad') || lowerMsg.includes('valeu') || lowerMsg.includes('tchau')) {
        return '😊 Por nada! Foi um prazer ajudá-lo hoje. Se precisar de mais alguma coisa, é só chamar! Tenha um ótimo dia e volte sempre! 🌟';
      } else {
        return `Recebi sua mensagem: "${userMessage}"\n\n✨ Este é um teste do sistema de WhatsApp Bot! Em produção, eu responderia automaticamente baseado nas configurações de IA e no contexto da sua loja.\n\nPosso ajudar com:\n• Informações sobre produtos\n• Preços e promoções\n• Horários de funcionamento\n• Formas de pagamento\n• E muito mais!\n\nO que gostaria de saber?`;
      }
    };
    
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now().toString(),
        text: generateResponse(userMessage),
        sender: 'bot',
        timestamp: new Date(),
        status: 'delivered'
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setInputMessage(template.message);
      setSelectedTemplate('');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Loader2 className="h-3 w-3 animate-spin text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatMessageTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ptBR });
  };

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className={`${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Bot className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Teste de Chat WhatsApp</CardTitle>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                <p className="text-sm text-gray-500">
                  {isConnected ? 'Conectado e pronto para testes' : 'Desconectado - conecte primeiro na aba Conexão'}
                </p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkConnectionStatus}
            className="text-xs"
          >
            Atualizar Status
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Phone number input */}
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Número do WhatsApp para teste (com DDD)"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  className="bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">Ex: 5511999999999 (com código do país)</p>
              </div>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Templates" />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!isConnected && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  WhatsApp Bot não está conectado. Conecte na aba "Conexão" para enviar mensagens reais.
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputMessage("Olá! 👋 Esta é uma mensagem de teste.")}
                className="text-xs"
              >
                Teste Rápido
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputMessage("Gostaria de saber mais sobre os produtos disponíveis.")}
                className="text-xs"
              >
                Consulta Produto
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMessages([])}
                className="text-xs"
              >
                Limpar Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1">Envie uma mensagem para testar o bot</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className={`text-xs ${
                        message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {message.sender === 'user' && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && (
          <div className="px-4 pb-2">
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Message input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
              placeholder="Digite uma mensagem..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-white"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !inputMessage.trim()}
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}