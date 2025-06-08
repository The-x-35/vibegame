import { jwtDecode } from "jwt-decode";
import { jwtVerify, decodeProtectedHeader } from "jose";
import { AppTokenPayload } from "./types";
import { Buffer } from "buffer";
import { PublicKey } from '@solana/web3.js';

// Secret key for verifying tokens - should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

export interface WalletAuthPayload {
  wallet: string;
  publicKey: PublicKey;
}

/**
 * Verifies a JWT token's validity and returns the decoded payload
 *
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export async function verifyToken(token: string): Promise<AppTokenPayload | null> {
    if (!JWT_SECRET) {
        console.error("Missing JWT_SECRET environment variable; cannot verify tokens");
        return null;
    }
    // Debug: log that secret is loaded and inspect its length
    console.log(`verifyToken: JWT_SECRET loaded (length=${JWT_SECRET.length})`);
    // Debug: log the token header to verify algorithm
    try {
        const header = decodeProtectedHeader(token);
        console.log('verifyToken: token header', header);
    } catch (e) {
        console.error('verifyToken: failed to decode token header', e);
    }
    try {
        // Basic structure validation with jwt-decode
        let decoded: AppTokenPayload;

        try {
            decoded = jwtDecode<AppTokenPayload>(token);
        } catch (error) {
            console.error("Token decoding failed:", error);
            return null;
        }

        // Verify token signature and expiration
        try {
            const encoder = new TextEncoder();
            let payloadResult: unknown;
            try {
                // Try verifying with UTF-8 encoded secret
                const secretKeyUtf8 = encoder.encode(JWT_SECRET);
                const { payload } = await jwtVerify(token, secretKeyUtf8, {
                    algorithms: ["HS256"],
                });
                payloadResult = payload;
            } catch (utf8Error) {
                try {
                    // Try verifying with Base64-decoded secret
                    const rawKey = Buffer.from(JWT_SECRET, "base64");
                    const secretKeyBase64 = new Uint8Array(rawKey);
                    const { payload } = await jwtVerify(token, secretKeyBase64, {
                        algorithms: ["HS256"],
                    });
                    payloadResult = payload;
                } catch (base64Error) {
                    console.error("Token signature verification failed:", utf8Error);
                    return null;
                }
            }

            // Cast to AppTokenPayload
            const verifiedPayload = (payloadResult as unknown) as AppTokenPayload;

            // Check if the required fields are present
            if (!verifiedPayload.wallet || !verifiedPayload.userId) {
                return null; // Missing required fields
            }

            return verifiedPayload;
        } catch (error) {
            console.error("Token signature verification failed:", error);
            return null;
        }
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

/**
 * Verifies a wallet address is valid
 * 
 * @param wallet Wallet address to verify
 * @returns True if valid, false otherwise
 */
export function verifyWallet(wallet: string): boolean {
  try {
    new PublicKey(wallet);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a wallet auth payload
 * 
 * @param wallet Wallet address
 * @returns Wallet auth payload
 */
export function createWalletAuthPayload(wallet: string): WalletAuthPayload {
  const publicKey = new PublicKey(wallet);
  return {
    wallet,
    publicKey
  };
}
