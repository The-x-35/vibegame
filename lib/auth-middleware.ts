import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { verifyWallet } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    wallet: string;
  };
}

/**
 * Middleware to authenticate API requests using JWT tokens
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest | NextResponse> {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Add user info to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = {
    wallet: payload.wallet
  };

  return authenticatedRequest;
}

/**
 * Middleware to verify wallet address format
 */
export function validateWalletAddress(wallet: string): boolean {
  return verifyWallet(wallet);
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record) return 0;
    return Math.max(0, record.resetTime - Date.now());
  }
}

// Global rate limiters
export const likeRateLimiter = new RateLimiter(5, 60000); // 5 likes per minute
export const viewRateLimiter = new RateLimiter(10, 60000); // 10 views per minute
export const commentRateLimiter = new RateLimiter(3, 60000); // 3 comments per minute

/**
 * CSRF protection utility
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // In production, validate against your domain
  if (process.env.NODE_ENV === 'production') {
    const allowedDomains = [
      'https://vibegame.fun',
      'https://www.vibegame.fun',
      'https://app.vibegame.fun'
    ];
    
    // Allow any subdomain of vibegame.fun (e.g., mario.vibegame.fun, alpha.vibegame.fun, etc.)
    const vibegameSubdomainPattern = /^https:\/\/([^.]+\.)*vibegame\.fun$/;
    
    if (origin) {
      // Check exact matches first
      if (allowedDomains.includes(origin)) {
        return true;
      }
      // Check if it's any subdomain of vibegame.fun
      if (vibegameSubdomainPattern.test(origin)) {
        return true;
      }
      return false;
    }
    
    if (referer) {
      // Check exact matches first
      if (allowedDomains.some(domain => referer.startsWith(domain))) {
        return true;
      }
      // Check if it's any subdomain of vibegame.fun
      if (vibegameSubdomainPattern.test(new URL(referer).origin)) {
        return true;
      }
      return false;
    }
    
    // If no origin or referer, allow the request (for API calls from same origin)
    return true;
  }
  
  return true;
} 