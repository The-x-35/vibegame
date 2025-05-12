import { jwtDecode } from "jwt-decode";
import { jwtVerify } from "jose";
import { AppTokenPayload } from "./types";

// Secret key for verifying tokens - should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies a JWT token's validity and returns the decoded payload
 *
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export async function verifyToken(token: string): Promise<AppTokenPayload | null> {
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
            const secretKey = encoder.encode(JWT_SECRET);

            const { payload } = await jwtVerify(token, secretKey, {
                algorithms: ["HS256"], // Use the algorithm that matches how your tokens are signed
            });

            // Cast to unknown first then to AppTokenPayload to avoid the type error
            const verifiedPayload = payload as unknown as AppTokenPayload;

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
