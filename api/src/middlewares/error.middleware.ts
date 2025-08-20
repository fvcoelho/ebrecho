import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: 'Dados inválidos',
      details: err.errors,
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