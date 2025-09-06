import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Template processing function
function processTemplate(template: string, data: any): string {
  try {
    // Replace template variables with actual data
    let processed = template;
    
    // Replace store variables
    processed = processed.replace(/\{\{store\.name\}\}/g, data.store?.name || '[Store Name]');
    
    // Handle products.map() expressions
    const productMapRegex = /\{\{products\.map\((.*?)\)\.join\((.*?)\)\}\}/g;
    processed = processed.replace(productMapRegex, (match, mapFunction, joinSeparator) => {
      if (!data.products || !Array.isArray(data.products)) return '';
      
      try {
        // Extract the mapping function and apply it
        const funcBody = mapFunction.replace('product => `', '').replace('`', '');
        const separator = joinSeparator.replace(/['"]/g, '').replace('\\n', '\n');
        
        return data.products.map((product: any) => {
          // Create product URL using current domain and slug
          const currentDomain = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ebrecho.com.br';
          const productUrl = `${currentDomain}/${data.store.slug}/produto/${product.slug}`;
          
          return funcBody
            .replace(/\$\{product\.name\}/g, product.name || '')
            .replace(/\$\{product\.price\}/g, product.price ? `${product.price}` : '')
            .replace(/\$\{product\.condition\}/g, product.condition || '')
            .replace(/\$\{product\.slug\}/g, product.slug || '')
            .replace(/\$\{product\.url\}/g, productUrl);
        }).join(separator);
      } catch (e) {
        return '[Error processing products]';
      }
    });
    
    // Handle businessHours Object.entries() expressions
    const businessHoursRegex = /\{\{Object\.entries\(store\.businessHours\)\.map\((.*?)\)\.join\((.*?)\)\}\}/g;
    processed = processed.replace(businessHoursRegex, (match, mapFunction, joinSeparator) => {
      if (!data.store?.businessHours) return '';
      
      try {
        const separator = joinSeparator.replace(/['"]/g, '').replace('\\n', '\n');
        
        return Object.entries(data.store.businessHours).map(([day, hours]: [string, any]) => {
          const dayTranslation: { [key: string]: string } = {
            monday: 'Segunda',
            tuesday: 'Terça',
            wednesday: 'Quarta',
            thursday: 'Quinta',
            friday: 'Sexta',
            saturday: 'Sábado',
            sunday: 'Domingo'
          };
          
          const translatedDay = dayTranslation[day] || day;
          const openTime = hours?.open || 'Fechado';
          const closeTime = hours?.close || '';
          
          return `${translatedDay}: ${openTime}${closeTime ? ` - ${closeTime}` : ''}`;
        }).join(separator);
      } catch (e) {
        return '[Error processing business hours]';
      }
    });
    
    // Handle address template string
    const addressRegex = /\{\{`\$\{store\.address\.street\}, \$\{store\.address\.number\} - \$\{store\.address\.city\}\/\$\{store\.address\.state\}`\}\}/g;
    processed = processed.replace(addressRegex, () => {
      if (!data.store?.address) return '[Endereço não disponível]';
      
      const { street, number, city, state } = data.store.address;
      return `${street || ''}, ${number || ''} - ${city || ''}/${state || ''}`;
    });
    
    // Handle FAQ map expressions
    const faqRegex = /\{\{aiInstructions\.faq\.map\((.*?)\)\.join\((.*?)\)\}\}/g;
    processed = processed.replace(faqRegex, (match, mapFunction, joinSeparator) => {
      if (!data.aiInstructions?.faq || !Array.isArray(data.aiInstructions.faq)) return '';
      
      try {
        const separator = joinSeparator.replace(/['"]/g, '').replace('\\n', '\n');
        
        return data.aiInstructions.faq.map((item: any) => {
          return `**Q: ${item.question}**\nA: ${item.answer}`;
        }).join(separator);
      } catch (e) {
        return '[Error processing FAQ]';
      }
    });
    
    return processed;
  } catch (error) {
    console.error('Error processing template:', error);
    return template;
  }
}

async function getStoreData(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    console.log(`Fetching store data from: ${apiUrl}/api/public/store/${slug}/bot-integration`);
    
    const response = await fetch(`${apiUrl}/api/public/store/${slug}/bot-integration`, {
      cache: 'no-store' // Always fetch fresh data for AI instructions
    });

    if (!response.ok) {
      console.log(`API response not OK: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch store data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Store data fetched successfully for ${slug}`);
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching store data:', error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  const storeData = await getStoreData(resolvedParams.slug);

  if (!storeData) {
    return new NextResponse('Store not found', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }

  // Get the AI instructions prompt - either from database model or fallback to JSON field
  let instructionsPrompt = '';
  
  if (storeData.aiInstructions?.prompt) {
    instructionsPrompt = storeData.aiInstructions.prompt;
  } else {
    // Fallback to default instructions
    instructionsPrompt = `# Instruções do Assistente Virtual

## Função
Você é um agente virtual de atendimento ao cliente de uma loja. Seu papel é atender clientes de forma educada, clara e eficiente, ajudando em dúvidas sobre produtos, pedidos, prazos de entrega, formas de pagamento, promoções e políticas da loja.

## Instruções principais

- Sempre cumprimente o cliente de forma simpática e acolhedora
- Responda de maneira objetiva, mas cordial, adaptando o tone conforme a conversa
- Caso não tenha certeza sobre uma resposta, explique a limitação e ofereça ajuda alternativa

## Produtos da loja:
{{products.map(product => \`- [\${product.name}](\${product.url}): R$ \${product.price} (\${product.condition})\`).join('\\n')}}

## Horários de funcionamento:
{{Object.entries(store.businessHours).map(([day, hours]) => \`\${day}: \${hours.open || 'Fechado'} - \${hours.close || ''}\`).join('\\n')}}

## Endereço:
{{\`\${store.address.street}, \${store.address.number} - \${store.address.city}/\${store.address.state}\`}}

## Perguntas frequentes:
{{aiInstructions.faq.map(item => \`**Q: \${item.question}**\\nA: \${item.answer}\`).join('\\n\\n')}}

## Exemplo de início de conversa:
👋 Olá! Bem-vindo(a) à {{store.name}}. Como posso ajudar você hoje?

- Deseja informações sobre um produto?
- Consultar o status de um pedido?
- Ou conhecer nossas promoções atuais?`;
  }

  // Process template variables
  const processedInstructions = processTemplate(instructionsPrompt, storeData);

  // Return raw markdown as plain text
  return new NextResponse(processedInstructions, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}