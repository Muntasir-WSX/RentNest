import type { AuthTokenPayload } from '../../modules/auth/auth.tokens.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};