import { GoogleGenAI } from '@google/genai';

export interface ValidationSuggestion {
  type: 'name' | 'description';
  field: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface ValidationResponse {
  hasSuggestions: boolean;
  suggestions: ValidationSuggestion[];
}

export interface ProductValidationRequest {
  name: string;
  description?: string;
}

export class GeminiValidationService {
  private ai: GoogleGenAI;
  private model: string = 'gemini-2.0-flash-001';

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async validateProduct(data: ProductValidationRequest): Promise<ValidationResponse> {
    try {
      console.log('🤖 Starting Gemini validation for product:', {
        name: data.name,
        hasDescription: !!data.description
      });

      const prompt = this.buildValidationPrompt(data);
      
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text;
      if (!responseText) {
        console.log('⚠️ Empty response from Gemini');
        return { hasSuggestions: false, suggestions: [] };
      }

      console.log('📝 Raw Gemini response:', responseText);

      const parsed = JSON.parse(responseText);
      const validationResponse: ValidationResponse = {
        hasSuggestions: parsed.hasSuggestions || false,
        suggestions: parsed.suggestions || []
      };

      console.log('✅ Gemini validation completed:', {
        hasSuggestions: validationResponse.hasSuggestions,
        suggestionsCount: validationResponse.suggestions.length
      });

      return validationResponse;

    } catch (error) {
      console.error('❌ Error in Gemini validation:', error);
      // Return empty suggestions on error to allow form submission to continue
      return { hasSuggestions: false, suggestions: [] };
    }
  }

  private buildValidationPrompt(data: ProductValidationRequest): string {
    return `Você é um assistente especializado em melhorar listagens de produtos para e-commerce de roupas usadas (brechó) no Brasil.

Analise o nome e descrição do produto fornecidos e sugira melhorias APENAS se necessário:

PRODUTO:
Nome: "${data.name}"
Descrição: "${data.description || ''}"

INSTRUÇÕES:
1. Para o NOME do produto:
   - Verifique capitalização (primeira letra de cada palavra importante em maiúscula)
   - Corrija erros gramaticais óbvios
   - Mantenha o estilo brasileiro e informal quando apropriado
   - NÃO mude o significado ou adicione informações que não estão no original

2. Para a DESCRIÇÃO do produto:
   - Corrija erros gramaticais e de digitação
   - Melhore a clareza e fluidez do texto
   - Mantenha o tom e estilo original
   - NÃO adicione informações que não estão no texto original
   - NÃO mude o significado

3. REGRAS IMPORTANTES:
   - Apenas sugira mudanças se houver problemas óbvios (erros, capitalização incorreta)
   - Se o texto está bom, retorne hasSuggestions: false
   - Seja conservador - prefira não sugerir a sugerir mudanças desnecessárias
   - Mantenha a personalidade e estilo do vendedor

RESPOSTA OBRIGATÓRIA EM JSON:
{
  "hasSuggestions": boolean,
  "suggestions": [
    {
      "type": "name" | "description",
      "field": "name" | "description",
      "original": "texto original",
      "suggested": "texto melhorado",
      "reason": "explicação da melhoria em português"
    }
  ]
}

Responda APENAS com o JSON, sem texto adicional:`;
  }
}