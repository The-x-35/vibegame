export interface AppTokenPayload {
    sub: string; // email
    userId: string;
    wallet: string;
    exp?: number;
    iat?: number;
}
