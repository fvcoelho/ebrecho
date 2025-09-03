import axios, { AxiosResponse } from 'axios';
import QRCode from 'qrcode';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evo.ebrecho.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

interface EvolutionApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface InstanceCreateParams {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  integration?: string;
  number?: string;
  webhookUrl?: string;
}

interface InstanceConnectResponse {
  pairingCode?: string;
  code?: string;
  count?: number;
  qrcode?: string;
}

interface InstanceConnectionState {
  instanceName: string;
  state: string; // 'open', 'close', 'connecting'
}

export class EvolutionApiService {
  private apiClient = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(EVOLUTION_API_KEY && { 'apikey': EVOLUTION_API_KEY })
    }
  });

  /**
   * Convert WhatsApp raw QR code data to base64 image
   */
  private async convertQRCodeToBase64(rawQRCode: string): Promise<string | null> {
    try {
      // Check if it's already a base64 image
      if (rawQRCode.startsWith('data:image/')) {
        return rawQRCode;
      }

      // Convert raw WhatsApp QR code data to proper QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(rawQRCode, {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Extract base64 part (remove data:image/png;base64, prefix)
      return qrCodeDataUrl.split(',')[1];
    } catch (error) {
      console.error('Error converting QR code to base64:', error);
      return null;
    }
  }

  constructor() {
    // Request interceptor for logging
    this.apiClient.interceptors.request.use((config) => {
      console.log(`Evolution API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor for logging
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`Evolution API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`Evolution API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(params: InstanceCreateParams): Promise<EvolutionApiResponse> {
    try {
      // Start with minimal required payload
      const payload: any = {
        instanceName: params.instanceName,
        token: params.token || 'default-token', // Evolution API requires a token
      };

      // Add optional parameters
      if (params.qrcode !== false) {
        payload.qrcode = true;
      }

      // Integration is required - default to WHATSAPP-BAILEYS if not specified
      payload.integration = params.integration || 'WHATSAPP-BAILEYS';

      // Add number if provided - required for some integrations
      if (params.number) {
        payload.number = params.number;
      }

      // Add webhook configuration if provided
      if (params.webhookUrl) {
        payload.webhook = {
          url: params.webhookUrl,
          byEvents: false,
          base64: false
        };
      }

      const response: AxiosResponse = await this.apiClient.post('/instance/create', payload);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error creating Evolution API instance:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create instance'
      };
    }
  }

  /**
   * Connect to an instance and get QR code
   */
  async connectInstance(instanceName: string): Promise<EvolutionApiResponse<InstanceConnectResponse>> {
    try {
      const response: AxiosResponse = await this.apiClient.get(`/instance/connect/${instanceName}`);

      // Convert raw QR code to base64 image if present
      if (response.data && (response.data.qrcode || response.data.code)) {
        const rawQRCode = response.data.qrcode || response.data.code;
        console.log('Raw QR code received from Evolution API:', rawQRCode);
        
        const base64QRCode = await this.convertQRCodeToBase64(rawQRCode);
        if (base64QRCode) {
          response.data.qrcode = base64QRCode;
          console.log('Successfully converted QR code to base64 image');
        } else {
          console.warn('Failed to convert QR code, keeping original format');
        }
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error connecting to Evolution API instance:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to connect to instance'
      };
    }
  }

  /**
   * Get connection state of an instance
   */
  async getConnectionState(instanceName: string): Promise<EvolutionApiResponse<InstanceConnectionState>> {
    try {
      const response: AxiosResponse = await this.apiClient.get(`/instance/connectionState/${instanceName}`);

      // Evolution API returns nested structure: { instance: { instanceName, state } }
      const connectionState = {
        instanceName: response.data?.instance?.instanceName || instanceName,
        state: response.data?.instance?.state || 'close'
      };

      return {
        success: true,
        data: connectionState
      };
    } catch (error: any) {
      console.error('Error getting Evolution API instance state:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get instance state'
      };
    }
  }

  /**
   * Logout an instance
   */
  async logoutInstance(instanceName: string): Promise<EvolutionApiResponse> {
    try {
      const response: AxiosResponse = await this.apiClient.delete(`/instance/logout-instance/${instanceName}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error logging out Evolution API instance:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to logout instance'
      };
    }
  }

  /**
   * Delete an instance
   */
  async deleteInstance(instanceName: string): Promise<EvolutionApiResponse> {
    try {
      const response: AxiosResponse = await this.apiClient.delete(`/instance/delete-instance/${instanceName}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error deleting Evolution API instance:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete instance'
      };
    }
  }

  /**
   * Set presence for an instance
   */
  async setPresence(instanceName: string, presence: 'available' | 'unavailable' | 'typing' | 'recording'): Promise<EvolutionApiResponse> {
    try {
      const response: AxiosResponse = await this.apiClient.post(`/instance/set-presence/${instanceName}`, {
        presence
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error setting Evolution API instance presence:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to set presence'
      };
    }
  }

  /**
   * Fetch all instances
   */
  async fetchInstances(): Promise<EvolutionApiResponse> {
    try {
      const response: AxiosResponse = await this.apiClient.get('/instance/fetch-instances');

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching Evolution API instances:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch instances'
      };
    }
  }

  /**
   * Restart an instance
   */
  async restartInstance(instanceName: string): Promise<EvolutionApiResponse> {
    try {
      const response: AxiosResponse = await this.apiClient.put(`/instance/restart-instance/${instanceName}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error restarting Evolution API instance:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to restart instance'
      };
    }
  }

  /**
   * Generate instance name for a partner
   */
  static generateInstanceName(partnerId: string, whatsappNumber?: string): string {
    return `ebrecho-${partnerId}`;
  }

  /**
   * Generate webhook URL for a partner
   */
  static generateWebhookUrl(partnerId: string, whatsappNumber?: string): string {
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    const identifier = whatsappNumber ? whatsappNumber.replace(/\D/g, '') : partnerId;
    return `${baseUrl}/api/webhooks/whatsapp/${identifier}`;
  }
}

export const evolutionApiService = new EvolutionApiService();