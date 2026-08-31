import type { Request, Response, NextFunction } from 'express';
import { type ZodType, ZodError } from 'zod';

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateData = schema.parse(req.body)
      req.body = validateData
      next()
    } catch (e) {
      if(e instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: e.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
      }
      next(e)
    }
  }
}