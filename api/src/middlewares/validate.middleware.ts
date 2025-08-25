import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodSchema } from 'zod';

export const validate = (schema: AnyZodObject | ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};