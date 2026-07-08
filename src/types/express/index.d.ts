import type { AuthTokenPayload } from "../../modules/auth/auth.tokens";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};