import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../errors';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const path = first?.path.join('.');
    return res.status(400).json({
      error: path ? `${path}: ${first?.message}` : first?.message ?? 'Invalid input',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'That value already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' });
    }
  }

  console.error(err);
  return res.status(500).json({ error: 'Something went wrong' });
}
