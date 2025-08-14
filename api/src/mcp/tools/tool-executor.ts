import { MCPTool } from './openapi-parser.js';
import axios, { AxiosResponse } from 'axios';

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  headers?: any;
  executionTime?: number;
}

export class ToolExecutor {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'eBrecho-MCP-Client/1.0.0',
    };
  }

  /**
   * Executa uma ferramenta MCP fazendo a chamada HTTP correspondente
   */
  async executeTool(tool: MCPTool, parameters: any = {}): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Preparar URL
      const url = this.buildUrl(tool.endpoint.path, parameters);
      
      // Preparar headers
      const headers = this.buildHeaders(parameters);
      
      // Preparar dados do corpo
      const data = this.buildRequestBody(tool, parameters);
      
      // Preparar query parameters
      const queryParams = this.buildQueryParams(tool, parameters);

      console.log(`🔧 Executando ferramenta: ${tool.name}`);
      console.log(`📡 ${tool.endpoint.method} ${url}`);

      // Fazer a requisição HTTP
      const response = await this.makeHttpRequest(
        tool.endpoint.method,
        url,
        headers,
        data,
        queryParams
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
        executionTime,
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      if (error.response) {
        // Erro HTTP
        return {
          success: false,
          error: `Erro HTTP ${error.response.status}: ${error.response.statusText}`,
          status: error.response.status,
          data: error.response.data,
          executionTime,
        };
      } else if (error.request) {
        // Erro de rede
        return {
          success: false,
          error: 'Erro de conexão: Não foi possível conectar ao servidor',
          executionTime,
        };
      } else {
        // Outros erros
        return {
          success: false,
          error: `Erro interno: ${error.message}`,
          executionTime,
        };
      }
    }
  }

  private buildUrl(pathTemplate: string, parameters: any): string {
    let url = pathTemplate;

    // Substituir parâmetros de path
    const pathParams = pathTemplate.match(/{([^}]+)}/g);
    if (pathParams) {
      pathParams.forEach(param => {
        const paramName = param.slice(1, -1); // Remove { }
        if (parameters[paramName]) {
          url = url.replace(param, encodeURIComponent(parameters[paramName]));
        }
      });
    }

    return `${this.baseUrl}${url}`;
  }

  private buildHeaders(parameters: any): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Adicionar token de autenticação se fornecido
    if (parameters.authorization || parameters.token) {
      const token = parameters.authorization || parameters.token;
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    // Headers customizados
    if (parameters.headers && typeof parameters.headers === 'object') {
      Object.assign(headers, parameters.headers);
    }

    return headers;
  }

  private buildRequestBody(tool: MCPTool, parameters: any): any {
    const { method } = tool.endpoint;
    
    // Métodos que não precisam de body
    if (['GET', 'DELETE'].includes(method)) {
      return undefined;
    }

    // Se há um parâmetro 'body', usar ele diretamente
    if (parameters.body) {
      return parameters.body;
    }

    // Construir body a partir dos parâmetros
    const bodyParams: any = {};
    const excludeFromBody = new Set(['authorization', 'token', 'headers']);

    // Extrair parâmetros de path para não incluir no body
    const pathParams = tool.endpoint.path.match(/{([^}]+)}/g);
    if (pathParams) {
      pathParams.forEach(param => {
        const paramName = param.slice(1, -1);
        excludeFromBody.add(paramName);
      });
    }

    // Extrair query parameters
    if (tool.endpoint.parameters) {
      tool.endpoint.parameters.forEach(param => {
        if (param.in === 'query') {
          excludeFromBody.add(param.name);
        }
      });
    }

    // Incluir apenas parâmetros relevantes no body
    Object.entries(parameters).forEach(([key, value]) => {
      if (!excludeFromBody.has(key)) {
        bodyParams[key] = value;
      }
    });

    return Object.keys(bodyParams).length > 0 ? bodyParams : undefined;
  }

  private buildQueryParams(tool: MCPTool, parameters: any): Record<string, string> {
    const queryParams: Record<string, string> = {};

    // Parâmetros de query definidos na spec
    if (tool.endpoint.parameters) {
      tool.endpoint.parameters.forEach(param => {
        if (param.in === 'query' && parameters[param.name] !== undefined) {
          queryParams[param.name] = String(parameters[param.name]);
        }
      });
    }

    return queryParams;
  }

  private async makeHttpRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    data?: any,
    params?: Record<string, string>
  ): Promise<AxiosResponse> {
    const config: any = {
      method: method.toLowerCase(),
      url,
      headers,
      timeout: 30000, // 30 segundos
    };

    if (data) {
      config.data = data;
    }

    if (params && Object.keys(params).length > 0) {
      config.params = params;
    }

    return axios(config);
  }

  /**
   * Testa a conectividade com a API
   */
  async healthCheck(): Promise<ToolExecutionResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
        headers: this.defaultHeaders,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Health check falhou: ${error.message}`,
      };
    }
  }

  /**
   * Define o token de autenticação padrão
   */
  setAuthToken(token: string): void {
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    this.defaultHeaders['Authorization'] = authToken;
  }

  /**
   * Remove o token de autenticação
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Define a URL base da API
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slash
  }

  /**
   * Adiciona headers padrão
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.defaultHeaders, headers);
  }
}