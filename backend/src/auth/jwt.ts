import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../shared/types';

export function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    config.jwt.refreshSecret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwt.secret) as { userId: string; email: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
}
