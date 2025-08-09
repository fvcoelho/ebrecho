const GLAM_AI_API_KEY = '32iBMnBLSUrgRvZNhuRlNA';
const GLAM_AI_BASE_URL = 'https://api.glam.ai/api/v1';

export interface TryOnRequest {
  mask_type: 'overall';
}

export interface TryOnResponse {
  event_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface TryOnResult {
  event_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

class GlamAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = GLAM_AI_API_KEY;
    this.baseUrl = GLAM_AI_BASE_URL;
  }

  private getHeaders() {
    return {
      'accept': 'application/json',
      'X-API-Key': this.apiKey
    };
  }

  async createTryOn(personImage: File, garmentImage: File, options: TryOnRequest): Promise<TryOnResponse> {
    console.log('[Glam AI] Creating try-on request:', {
      personImage: personImage.name,
      garmentImage: garmentImage.name,
      options
    });

    const formData = new FormData();
    formData.append('person_image', personImage);
    formData.append('garment_image', garmentImage);
    formData.append('mask_type', options.mask_type);

    try {
      const response = await fetch(`${this.baseUrl}/tryon`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      });

      const result = await response.json();

      console.log('[Glam AI] Try-on request response:', {
        status: response.status,
        result
      });

      if (!response.ok) {
        throw new Error(`Try-on request failed: ${result.error || response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error('[Glam AI] Try-on request error:', error);
      throw error;
    }
  }

  async getTryOnResult(eventId: string): Promise<TryOnResult> {
    console.log('[Glam AI] Getting try-on result for event:', eventId);

    try {
      const response = await fetch(`${this.baseUrl}/tryon/${eventId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result = await response.json();

      console.log('[Glam AI] Try-on result response:', {
        status: response.status,
        eventId,
        result
      });

      if (!response.ok) {
        throw new Error(`Get result failed: ${result.error || response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error('[Glam AI] Get result error:', error);
      throw error;
    }
  }

  async pollForResult(eventId: string, maxAttempts: number = 30, intervalMs: number = 10000): Promise<TryOnResult> {
    console.log('[Glam AI] Starting polling for result:', {
      eventId,
      maxAttempts,
      intervalMs
    });

    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          console.log(`[Glam AI] Polling attempt ${attempts}/${maxAttempts}`);

          const result = await this.getTryOnResult(eventId);

          if (result.status === 'completed') {
            console.log('[Glam AI] Try-on completed successfully');
            resolve(result);
            return;
          }

          if (result.status === 'failed') {
            reject(new Error(result.error || 'Try-on processing failed'));
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error('Try-on processing timed out'));
            return;
          }

          // Continue polling
          setTimeout(poll, intervalMs);

        } catch (error) {
          console.error('[Glam AI] Polling error:', error);
          reject(error);
        }
      };

      // Start polling after initial delay
      setTimeout(poll, 5000);
    });
  }
}

export const glamAI = new GlamAIService();