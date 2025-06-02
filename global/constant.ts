import { PublicKey } from "@solana/web3.js";

// Wallet
export const WALLET = new PublicKey("AidmVBuszvzCJ6cWrBQfKNwgNPU4KCvXBcrWh91vitm8");

// API Endpoints
export const API_ENDPOINTS = {
    SIGN_ENDPOINT: 'https://mrgbnbr5uk.execute-api.eu-central-1.amazonaws.com/transactions/initiate-sign',
    AUTH_VERIFY_ENDPOINT: 'https://mrgbnbr5uk.execute-api.eu-central-1.amazonaws.com/auth/google/verify',
    SOLANA_RPC_ENDPOINT: 'https://flying-torrie-fast-mainnet.helius-rpc.com',
} as const;

// Alpha GUI URLs
export const ALPHA_GUI = {
    BASE_URL: 'https://alpha-gui.vercel.app',
    EMBED_URL: 'https://alpha-gui.vercel.app/embed.html',
    SEND_TOKEN_CA: 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa'
} as const;

// Website URLs
export const WEBSITE_URLS = {
    VIBE_GAME: 'https://vibegame.fun',
} as const;

// S3 Bucket Information
export const S3_CONFIG = {
    BUCKET: 'sb3-bucket-send-arcade',
    REGION: 'eu-north-1',
} as const;

// IPFS
export const IPFS = {
    GATEWAY: 'https://ipfs.io/ipfs',
} as const;


/**
 * Common token addresses used across the toolkit
 */
export const TOKENS = {
    SOL: new PublicKey("So11111111111111111111111111111111111111112"),
} as const;

/**
 * Default configuration options
 * @property {number} TOKEN_DECIMALS - Default number of decimals for new tokens
 * @property {number} RERERRAL_FEE - Referral fee in basis points
 */
export const DEFAULT_OPTIONS = {
    TOKEN_DECIMALS: 9,
    RERERRAL_FEE: 200,
} as const;

/**
 * Jupiter Ultra API URL
 */
export const JUP_ULTRA_API = "https://lite-api.jup.ag/ultra/v1";

export const JUP_REFERRAL_ADDRESS = "7seWe5mR6CcVreeDQEruV8FkJsNmsVW5zxGti7b3orb7";
