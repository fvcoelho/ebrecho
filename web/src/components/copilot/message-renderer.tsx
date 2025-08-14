"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  User, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Code,
  Database,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    toolCalls?: Array<{
      id: string;
      name: string;
      parameters: any;
      result?: {
        success: boolean;
        data?: any;
        error?: string;
        executionTime?: number;
      };
    }>;
    streaming?: boolean;
    conversationId?: string;
  };
}

interface MessageRendererProps {
  message: CopilotMessage;
}

export function MessageRenderer({ message }: MessageRendererProps) {
  const [copiedText, setCopiedText] = useState('');
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const toggleToolExpansion = (toolId: string) => {
    const newExpanded = new Set(expandedTools);
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId);
    } else {
      newExpanded.add(toolId);
    }
    setExpandedTools(newExpanded);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderToolCall = (toolCall: any, index: number) => {
    const isExpanded = expandedTools.has(toolCall.id);
    const hasResult = toolCall.result;

    return (
      <div key={toolCall.id} className="border rounded-lg p-4 bg-slate-50">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleToolExpansion(toolCall.id)}
        >
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-1.5 rounded">
              <Code className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900">
                {toolCall.name}
              </h4>
              <p className="text-xs text-gray-500">
                Ferramenta executada
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasResult && (
              <Badge 
                variant={toolCall.result.success ? "default" : "destructive"}
                className="text-xs"
              >
                {toolCall.result.success ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {toolCall.result.success ? 'Sucesso' : 'Erro'}
              </Badge>
            )}
            {toolCall.result?.executionTime && (
              <span className="text-xs text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {toolCall.result.executionTime}ms
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {/* Parâmetros */}
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">
                Parâmetros:
              </h5>
              <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
                {JSON.stringify(toolCall.parameters, null, 2)}
              </pre>
            </div>

            {/* Resultado */}
            {hasResult && (
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-2">
                  Resultado:
                </h5>
                {toolCall.result.success ? (
                  <div className="bg-white p-3 rounded border">
                    {typeof toolCall.result.data === 'object' ? (
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(toolCall.result.data, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-700">
                        {String(toolCall.result.data)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-3 rounded">
                    <p className="text-sm text-red-800">
                      {toolCall.result.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderContent = (content: string) => {
    // Detectar e renderizar código
    const codeBlocks = content.split(/```([\s\S]*?)```/);
    if (codeBlocks.length > 1) {
      return codeBlocks.map((block, index) => {
        if (index % 2 === 1) {
          // Bloco de código
          const lines = block.split('\\n');
          const language = lines[0] || '';
          const code = lines.slice(1).join('\\n');
          
          return (
            <div key={index} className="my-3">
              <div className="bg-gray-900 rounded-t-lg px-4 py-2 flex items-center justify-between">
                <span className="text-gray-400 text-xs font-medium">
                  {language || 'code'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(code)}
                  className="text-gray-400 hover:text-white h-6 px-2"
                >
                  {copiedText === code ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="bg-gray-800 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm">
                <code>{code}</code>
              </pre>
            </div>
          );
        } else {
          // Texto normal
          return (
            <div key={index} className="whitespace-pre-wrap">
              {block}
            </div>
          );
        }
      });
    }

    // Detectar tabelas markdown
    const lines = content.split('\\n');
    const tableLines: string[] = [];
    const nonTableContent: string[] = [];
    let inTable = false;

    lines.forEach(line => {
      if (line.includes('|') && (line.match(/\|/g) || []).length >= 2) {
        inTable = true;
        tableLines.push(line);
      } else if (inTable && line.trim() === '') {
        inTable = false;
        nonTableContent.push(renderTable(tableLines));
        tableLines.length = 0;
        nonTableContent.push(line);
      } else if (inTable) {
        inTable = false;
        nonTableContent.push(renderTable(tableLines));
        tableLines.length = 0;
        nonTableContent.push(line);
      } else {
        nonTableContent.push(line);
      }
    });

    if (tableLines.length > 0) {
      nonTableContent.push(renderTable(tableLines));
    }

    if (tableLines.length > 0 || lines.some(line => line.includes('|'))) {
      return <div className="space-y-2">{nonTableContent}</div>;
    }

    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  const renderTable = (lines: string[]) => {
    if (lines.length < 2) return lines.join('\\n');

    const headerLine = lines[0];
    const separatorLine = lines[1];
    const dataLines = lines.slice(2);

    const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
    const data = dataLines.map(line => 
      line.split('|').map(cell => cell.trim()).filter(Boolean)
    );

    return (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-600">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (message.role === 'user') {
    return (
      <div className="flex items-start space-x-3 justify-end">
        <Card className="bg-indigo-600 text-white max-w-3xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {renderContent(message.content)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(message.content)}
                className="text-indigo-200 hover:text-white hover:bg-indigo-700 ml-2 h-6 w-6 p-0"
              >
                {copiedText === message.content ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <div className="text-xs text-indigo-200 mt-2 text-right">
              {formatTimestamp(message.timestamp)}
            </div>
          </CardContent>
        </Card>
        <div className="bg-indigo-100 p-2 rounded-lg">
          <User className="h-5 w-5 text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="bg-gray-100 p-2 rounded-lg">
        <Bot className="h-5 w-5 text-gray-600" />
      </div>
      <div className="flex-1 max-w-3xl">
        <Card className="bg-white border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {renderContent(message.content)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(message.content)}
                className="text-gray-400 hover:text-gray-600 ml-2 h-6 w-6 p-0"
              >
                {copiedText === message.content ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Ferramentas executadas */}
            {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
              <div className="mt-4">
                <Separator className="mb-4" />
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Operações Executadas ({message.metadata.toolCalls.length})
                </h3>
                <div className="space-y-3">
                  {message.metadata.toolCalls.map((toolCall, index) => 
                    renderToolCall(toolCall, index)
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 mt-2">
              {formatTimestamp(message.timestamp)}
              {message.metadata?.conversationId && (
                <span className="ml-2">
                  • ID: {message.metadata.conversationId.slice(0, 8)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}