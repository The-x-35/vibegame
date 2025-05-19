import { PublicKey } from "@solana/web3.js";

// Wallet
export const REFERRAL_WALLET = new PublicKey("AidmVBuszvzCJ6cWrBQfKNwgNPU4KCvXBcrWh91vitm8");

// API Endpoints
export const API_ENDPOINTS = {
    SIGN_ENDPOINT: 'https://mrgbnbr5uk.execute-api.eu-central-1.amazonaws.com/transactions/initiate-sign',
    AUTH_VERIFY_ENDPOINT: 'https://mrgbnbr5uk.execute-api.eu-central-1.amazonaws.com/auth/google/verify',
    SOLANA_RPC_ENDPOINT: 'https://skilled-misti-fast-devnet.helius-rpc.com',
    SOLANA_MAINNET_RPC: 'https://api.mainnet-beta.solana.com',
} as const;

// Alpha GUI URLs
export const ALPHA_GUI = {
    BASE_URL: 'https://alpha-gui.vercel.app',
    EMBED_URL: 'https://alpha-gui.vercel.app/embed.html',
    SEND_TOKEN_CA: 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa'
} as const;

// Website URLs
export const WEBSITE_URLS = {
    SEND_ARCADE: 'https://www.vibegame.fun',
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