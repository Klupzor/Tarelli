import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env';

export interface AccessTokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

/** JWT de acceso, corta duración, payload mínimo (sub/iat/exp). Solo en memoria del frontend. */
export function signAccessToken(usuarioId: string): string {
  return jwt.sign({}, env.jwtAccessSecret, {
    subject: usuarioId,
    expiresIn: env.jwtAccessExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwtAccessSecret);
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Payload de access token inválido.');
  }
  return decoded as unknown as AccessTokenPayload;
}

export interface RawRefreshToken {
  id: string;
  secret: string;
  plaintext: string;
  secretHash: string;
  expiraEn: Date;
}

/**
 * Genera un nuevo refresh token opaco (no JWT): el valor persistido en la
 * cookie es "id.secret", donde `id` es la PK de la fila en refresh_tokens
 * (permite lookup O(1)) y `secret` es alta entropía. Solo se guarda
 * sha256(secret) en base de datos; el secreto crudo nunca se persiste.
 */
export function generateRefreshToken(): RawRefreshToken {
  const id = crypto.randomUUID();
  const secret = crypto.randomBytes(48).toString('hex');
  const expiraEn = new Date();
  expiraEn.setUTCDate(expiraEn.getUTCDate() + env.refreshTokenExpiresInDays);

  return {
    id,
    secret,
    plaintext: `${id}.${secret}`,
    secretHash: hashRefreshSecret(secret),
    expiraEn,
  };
}

export function hashRefreshSecret(secret: string): string {
  return crypto.createHmac('sha256', env.jwtRefreshSecret).update(secret).digest('hex');
}

export function parseRefreshCookie(value: string | undefined): { id: string; secret: string } | null {
  if (!value) return null;
  const separatorIndex = value.indexOf('.');
  if (separatorIndex <= 0) return null;
  const id = value.slice(0, separatorIndex);
  const secret = value.slice(separatorIndex + 1);
  if (!id || !secret) return null;
  return { id, secret };
}

export function secretMatchesHash(secret: string, hash: string): boolean {
  const computed = Buffer.from(hashRefreshSecret(secret));
  const expected = Buffer.from(hash);
  if (computed.length !== expected.length) return false;
  return crypto.timingSafeEqual(computed, expected);
}
