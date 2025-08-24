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
    return `Você é um assistente especializado em padronização de catálogo de produtos para e-commerce de roupas usadas (brechó) no Brasil.

Sua tarefa é revisar e melhorar o nome e descrição de um produto para que sejam claros, consistentes e visualmente bem organizados.

PRODUTO:
Nome: "${data.name}"
Descrição: "${data.description || ''}"

REGRAS DE PADRONIZAÇÃO:

1. O NOME do produto deve ser:
   - Conciso (até 60 caracteres)
   - Escrito em Title Case (primeira letra de cada palavra importante em maiúscula, exceto artigos e preposições)
   - Sem abreviações confusas ou termos redundantes
   - Corrija erros gramaticais óbvios
   - Mantenha o significado original

2. A DESCRIÇÃO do produto deve ser:
   - Escrita em frases claras e objetivas
   - Destacar as principais características (material, cor, tamanho, finalidade)
   - Usar marcadores se houver mais de 3 características
   - Máximo de 200 palavras
   - Sempre verificar correção gramatical e boa legibilidade
   - Melhorar a organização visual quando necessário

3. REGRAS IMPORTANTES:
   - APENAS sugira mudanças se houver problemas óbvios (erros, capitalização incorreta, texto confuso)
   - Se o texto já está bom, retorne hasSuggestions: false
   - Seja conservador - prefira não sugerir a sugerir mudanças desnecessárias
   - Mantenha a personalidade e estilo do vendedor
   - O idioma de saída deve ser sempre Português (Brasil)
   - NÃO adicione informações que não estão no original
   - NÃO mude drasticamente o significado

RESPOSTA OBRIGATÓRIA EM JSON:
{
  "hasSuggestions": boolean,
  "suggestions": [
    {
      "type": "name" | "description",
      "field": "name" | "description", 
      "original": "texto original",
      "suggested": "texto melhorado seguindo as regras de padronização",
      "reason": "explicação da melhoria aplicada (correção gramatical, capitalização, organização, etc.)"
    }
  ]
}

Responda APENAS com o JSON, sem texto adicional:`;
  }
}