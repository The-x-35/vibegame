export interface AppTokenPayload {
    sub: string; // email
    userId?: string; // Optional since we're using wallet-only auth now
    wallet: string;
    exp?: number;
    iat?: number;
}
