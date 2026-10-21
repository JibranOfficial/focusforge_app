import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { unauthorized } from '../errors';

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw unauthorized('Missing authorization token');
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (!payload.sub) throw unauthorized('Invalid token');
    req.userId = String(payload.sub);
    next();
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

/** Returns the authenticated user's id (use inside routes behind requireAuth). */
export function uid(req: Request): string {
  if (!req.userId) throw unauthorized();
  return req.userId;
}
