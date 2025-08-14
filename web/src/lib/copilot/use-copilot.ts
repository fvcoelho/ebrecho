"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { CopilotMessage } from '@/components/copilot/message-renderer';

interface CopilotHookReturn {
  messages: CopilotMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  sendMessage: (message: string, context?: any) => Promise<void>;
  clearConversation: () => void;
  retryLastMessage: () => Promise<void>;
}

export function useCopilot(): CopilotHookReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const lastMessageRef = useRef<string>('');
  const currentToolCallsRef = useRef<any[]>([]);

  // Debug messages changes
  useEffect(() => {
    console.log('🔍 Messages state changed:', messages);
  }, [messages]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addMessage = (message: Omit<CopilotMessage, 'id' | 'timestamp'>) => {
    const newMessage: CopilotMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateLastAssistantMessage = (content: string, metadata?: any) => {
    console.log('🔍 updateLastAssistantMessage called with:', { content, metadata });
    setMessages(prev => {
      console.log('🔍 Current messages before update:', prev);
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].role === 'assistant') {
        const updated = [...prev];
        updated[lastIndex] = {
          ...updated[lastIndex],
          content,
          metadata: { ...updated[lastIndex].metadata, ...metadata },
        };
        console.log('🔍 Updated messages:', updated);
        return updated;
      } else {
        console.log('🔍 No assistant message to update, lastIndex:', lastIndex, 'role:', prev[lastIndex]?.role);
      }
      return prev;
    });
  };

  const sendMessage = useCallback(async (message: string, context?: any) => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    lastMessageRef.current = userMessage;
    currentToolCallsRef.current = [];

    // Adicionar mensagem do usuário
    addMessage({
      role: 'user',
      content: userMessage,
    });

    // Inicializar mensagem do assistente vazia
    const assistantMessageId = addMessage({
      role: 'assistant',
      content: '',
      metadata: { streaming: true, toolCalls: [] },
    });

    setIsLoading(true);
    setIsStreaming(true);
    setConnectionStatus('connecting');

    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      console.log('🔍 Copilot Debug - Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔍 Copilot Debug - User from useAuth:', user);
      console.log('🔍 Copilot Debug - Saved user from localStorage:', savedUser ? JSON.parse(savedUser) : null);
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Por favor, faça login primeiro.');
      }

      const fullUrl = `${apiUrl}/api/mcp/chat`;
      console.log('🔍 Making request to:', fullUrl);
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: Date.now().toString(),
          context: {
            userRole: user?.role,
            partnerId: user?.partnerId,
            currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
            ...context,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      setConnectionStatus('connected');
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream não disponível');
      }

      console.log('🔍 Starting SSE processing...');
      console.log('🔍 Response headers:', response.headers);
      console.log('🔍 Response status:', response.status, response.statusText);
      const decoder = new TextDecoder();
      let buffer = '';
      let currentContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('🔍 SSE stream finished');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('🔍 Raw chunk received:', JSON.stringify(chunk));
        
        // Convert literal \n to actual newlines
        const normalizedChunk = chunk.replace(/\\n/g, '\n');
        console.log('🔍 Normalized chunk:', JSON.stringify(normalizedChunk));
        
        buffer += normalizedChunk;
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        console.log('🔍 Lines after splitting:', lines);

        console.log('🔍 Processing', lines.length, 'lines from buffer');
        for (const line of lines) {
          if (!line.trim()) {
            console.log('🔍 Skipping empty line');
            continue;
          }
          
          console.log('🔍 Processing line:', line);

          // Split the line into individual SSE fields
          const lines = line.split('\n');
          let event = null;
          let data = null;
          
          console.log('🔍 Individual lines:', lines);
          
          for (const singleLine of lines) {
            const trimmedLine = singleLine.trim();
            console.log('🔍 Checking line:', JSON.stringify(trimmedLine));
            if (trimmedLine.startsWith('event: ')) {
              event = trimmedLine.substring(7); // Remove 'event: '
              console.log('🔍 Found event:', event);
            } else if (trimmedLine.startsWith('data: ')) {
              data = trimmedLine.substring(6); // Remove 'data: '
              console.log('🔍 Found data:', data);
            }
          }

          console.log('🔍 Parsed event:', event);
          console.log('🔍 Parsed data:', data);

          if (event && data) {            
            let parsedData;
            
            try {
              parsedData = JSON.parse(data);
              console.log('🔍 Successfully parsed JSON data:', parsedData);
            } catch (error) {
              console.error('🔍 Error parsing JSON:', error, 'Raw data:', data);
              continue;
            }

            console.log('🔍 SSE Event received:', event, 'Data:', parsedData);
            
            switch (event) {
              case 'start':
                console.log('🔍 Chat started');
                break;

              case 'content':
                console.log('🔍 Adding content:', parsedData.content);
                currentContent += parsedData.content;
                console.log('🔍 Current content now:', currentContent);
                updateLastAssistantMessage(currentContent);
                console.log('🔍 Updated assistant message with content');
                break;

              case 'tool_call_start':
                const newToolCall = {
                  id: parsedData.toolId,
                  name: parsedData.toolName,
                  parameters: {},
                  result: null,
                };
                currentToolCallsRef.current.push(newToolCall);
                updateLastAssistantMessage(currentContent, { 
                  toolCalls: [...currentToolCallsRef.current] 
                });
                break;

              case 'tool_executing':
                const executingIndex = currentToolCallsRef.current.findIndex(
                  t => t.name === parsedData.toolName
                );
                if (executingIndex >= 0) {
                  currentToolCallsRef.current[executingIndex].parameters = parsedData.parameters;
                  updateLastAssistantMessage(currentContent, { 
                    toolCalls: [...currentToolCallsRef.current] 
                  });
                }
                break;

              case 'tool_result':
                const resultIndex = currentToolCallsRef.current.findIndex(
                  t => t.name === parsedData.toolName
                );
                if (resultIndex >= 0) {
                  currentToolCallsRef.current[resultIndex].result = {
                    success: parsedData.success,
                    data: parsedData.result,
                    error: parsedData.error,
                    executionTime: parsedData.executionTime,
                  };
                  updateLastAssistantMessage(currentContent, { 
                    toolCalls: [...currentToolCallsRef.current] 
                  });
                }
                break;

              case 'tool_error':
                const errorIndex = currentToolCallsRef.current.findIndex(
                  t => t.name === parsedData.toolName
                );
                if (errorIndex >= 0) {
                  currentToolCallsRef.current[errorIndex].result = {
                    success: false,
                    error: parsedData.error,
                  };
                  updateLastAssistantMessage(currentContent, { 
                    toolCalls: [...currentToolCallsRef.current] 
                  });
                }
                break;

              case 'end':
                updateLastAssistantMessage(currentContent || parsedData.message, {
                  streaming: false,
                  conversationId: parsedData.conversationId,
                  toolCalls: [...currentToolCallsRef.current],
                });
                break;

              case 'error':
                currentContent = `❌ Erro: ${parsedData.message}`;
                updateLastAssistantMessage(currentContent, { 
                  streaming: false,
                  toolCalls: [...currentToolCallsRef.current] 
                });
                break;
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Erro na comunicação:', error);
      setConnectionStatus('error');
      
      updateLastAssistantMessage(
        `❌ Erro de conexão: ${error.message}\\n\\nVerifique sua conexão e tente novamente.`,
        { streaming: false }
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      currentToolCallsRef.current = [];
    }
  }, [user, apiUrl, isLoading]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    lastMessageRef.current = '';
    currentToolCallsRef.current = [];
    setConnectionStatus('disconnected');
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (lastMessageRef.current) {
      // Remover a última mensagem do assistente se houver erro
      setMessages(prev => {
        const filtered = prev.filter((msg, index) => {
          if (index === prev.length - 1 && msg.role === 'assistant') {
            return false;
          }
          return true;
        });
        return filtered;
      });

      await sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    isStreaming,
    connectionStatus,
    sendMessage,
    clearConversation,
    retryLastMessage,
  };
}