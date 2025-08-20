import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for CORS errors first
  if (err.message && err.message.includes('Access blocked:')) {
    const origin = req.headers.origin || req.headers.referer || 'unknown origin';
    return res.status(403).json({
      success: false,
      error: 'CORS Policy Error',
      message: 'This origin is not allowed to access the API',
      details: {
        origin: origin,
        hint: 'Please ensure your application is running from an allowed domain or configure CORS settings properly'
      }
    });
  }

  // Format console error output nicely for Zod errors
  if (err instanceof ZodError) {
    console.error('\n❌ Validation Error:');
    err.errors.forEach((error, index) => {
      const fieldPath = error.path.join('.');
      console.error(`   ${index + 1}. Field: "${fieldPath}"`);
      console.error(`      Message: ${error.message}`);
      if (error.code) {
        console.error(`      Code: ${error.code}`);
      }
    });
    console.error('\n');
  } else if (!err.message?.includes('Access blocked:')) {
    // Don't log CORS errors again since they're already logged in the CORS middleware
    console.error('Error:', err);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    // Format Zod errors into user-friendly messages
    const formattedErrors = err.errors.map(error => {
      // Build a readable field path
      const fieldPath = error.path.join('.');
      
      // Use custom message if available, otherwise format the default message
      let message = error.message;
      
      // Add field context for better clarity
      if (fieldPath && !message.toLowerCase().includes(fieldPath.toLowerCase())) {
        // Map technical field names to user-friendly names
        const fieldMappings: { [key: string]: string } = {
          'body.name': 'Nome',
          'body.email': 'E-mail',
          'body.password': 'Senha',
          'body.phone': 'Telefone',
          'body.cpf': 'CPF',
          'body.cnpj': 'CNPJ',
          'body.description': 'Descrição',
          'body.price': 'Preço',
          'body.sku': 'SKU',
          'body.quantity': 'Quantidade',
          'body.category': 'Categoria',
          'body.brand': 'Marca',
          'body.size': 'Tamanho',
          'body.color': 'Cor',
          'body.condition': 'Condição',
          'body.storeName': 'Nome da loja',
          'body.slug': 'URL da loja',
          'body.address': 'Endereço',
          'body.city': 'Cidade',
          'body.state': 'Estado',
          'body.zipCode': 'CEP',
          'body.pixKey': 'Chave PIX',
        };
        
        const friendlyFieldName = fieldMappings[fieldPath] || 
                                 fieldPath.replace('body.', '').replace(/([A-Z])/g, ' $1').trim();
        
        message = `${friendlyFieldName}: ${message}`;
      }
      
      return {
        field: fieldPath,
        message: message
      };
    });
    
    // Create a single, clear error message
    const mainMessage = formattedErrors.length === 1 
      ? formattedErrors[0].message 
      : `Encontramos ${formattedErrors.length} problemas com os dados enviados`;
    
    return res.status(422).json({
      success: false,
      error: mainMessage,
      validation_errors: formattedErrors,
      // Keep raw details for debugging in development
      details: process.env.NODE_ENV === 'development' ? err.errors : undefined,
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = err.meta?.target as string[];
      
      // Handle specific constraint combinations
      if (fields?.includes('partnerId') && fields?.includes('sku')) {
        return res.status(409).json({
          success: false,
          error: 'Este SKU já está em uso para este parceiro. Por favor, escolha um SKU diferente.',
        });
      }
      
      // Handle single field constraints
      const fieldName = fields?.[0] || 'Campo';
      let friendlyName = fieldName;
      
      // Map field names to user-friendly names
      const fieldMappings: { [key: string]: string } = {
        'email': 'E-mail',
        'sku': 'SKU',
        'slug': 'Nome do produto (já existe um produto com nome similar)',
        'partnerId': 'Parceiro'
      };
      
      friendlyName = fieldMappings[fieldName] || fieldName;
      
      return res.status(409).json({
        success: false,
        error: `${friendlyName} já está em uso`,
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
      });
    }
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};