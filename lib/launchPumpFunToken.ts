"use client";

import { Keypair, VersionedTransaction, Connection, PublicKey, TransactionMessage } from "@solana/web3.js";
import { Buffer } from "buffer";
import { BN } from "bn.js";
import { REFERRAL_WALLET, API_ENDPOINTS, S3_CONFIG, IPFS, WEBSITE_URLS } from "@/global/constant";
import { PUMP_PROGRAM_ID, PumpSdk, BondingCurve, getBuySolAmountFromTokenAmount } from "@pump-fun/pump-sdk";
import { PinataSDK } from "pinata";

export interface LaunchPumpFunTokenArgs {
  imageUrl: string;
  tokenName: string;
  tokenTicker: string;
  tokenDescription: string;
  tokenTelegram?: string;
  tokenTwitter?: string;
  tokenWebsite?: string;
  appToken: string;
  signEndpoint?: string;
  solanaRpcEndpoint?: string;
}

export async function launchPumpFunToken({
  imageUrl,
  tokenName,
  tokenTicker,
  tokenDescription,
  tokenTelegram,
  tokenTwitter,
  tokenWebsite,
  appToken,
  signEndpoint = API_ENDPOINTS.SIGN_ENDPOINT,
  solanaRpcEndpoint = API_ENDPOINTS.SOLANA_MAINNET_RPC,
}: LaunchPumpFunTokenArgs): Promise<string> {
  try {
    const connection = new Connection(solanaRpcEndpoint, 'confirmed');
    const pumpSdk = new PumpSdk(connection);
    const mint = Keypair.generate();

    const metadata = {
      name: tokenName,
      symbol: tokenTicker,
      description: tokenDescription,
      showName: true,
      createdOn: WEBSITE_URLS.SEND_ARCADE,
      image: imageUrl,
      twitter: tokenTwitter,
      telegram: tokenTelegram,
      website: tokenWebsite,
    };

    const metadataUri = await uploadJsonToPinata(metadata);

    const ix = await pumpSdk.createInstruction(mint.publicKey, metadata.name, metadata.symbol, metadataUri, REFERRAL_WALLET, (window as any).solana.publicKey);
    const globalState = await pumpSdk.fetchGlobal();

    const bondingCurve = {
      virtualTokenReserves: globalState.initialVirtualTokenReserves,
      virtualSolReserves: globalState.initialVirtualSolReserves,
      realTokenReserves: globalState.initialRealTokenReserves,
      realSolReserves: new BN(0),
      tokenTotalSupply: new BN(globalState.tokenTotalSupply),
      complete: false,
      creator: (window as any).solana.publicKey,
    };

    const buySolAmount = getBuySolAmountFromTokenAmount(globalState, bondingCurve, new BN(1000000), true);

    const buyIx = await pumpSdk.buyInstructions(
      globalState,
      null,
      bondingCurve,
      mint.publicKey,
      (window as any).solana.publicKey,
      new BN(1000000),
      buySolAmount,
      1,
      REFERRAL_WALLET
    );

    const { blockhash } = await connection.getLatestBlockhash();

    const messageV0 = new TransactionMessage({
      payerKey: (window as any).solana.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix, ...buyIx],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    const serialized = Buffer.from(tx.serialize()).toString('hex');
    const signRes = await fetch(signEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appToken}` },
      body: JSON.stringify({ operation: 'signTransaction', payload: serialized }),
    });
    const signJson = await signRes.json();
    if (!signRes.ok) {
      throw new Error(signJson.message || 'Signing failed');
    }

    const signedHex = signJson.signature;
    const signedBuf = Buffer.from(signedHex, 'hex');
    const txid = await connection.sendRawTransaction(signedBuf, { skipPreflight: true });
    await connection.confirmTransaction(txid, 'confirmed');

    return txid;
  } catch (error) {
    console.error("Error in launchPumpFunToken:", error);
    if (error instanceof Error && "logs" in error) {
      console.error("Transaction logs:", (error as any).logs);
    }
    throw error;
  }
}

/**
 * Upload a JSON object to Pinata IPFS
 * @param json - The JSON object to upload
 * @returns - The IPFS link to the uploaded content
 */
export type UploadResponse = {
  id: string;
  name: string;
  cid: string;
  size: number;
  created_at: string;
  number_of_files: number;
  mime_type: string;
  group_id: string | null;
  keyvalues: {
    [key: string]: string;
  };
  vectorized: boolean;
  network: string;
};

export async function uploadJsonToPinata(json: Record<string, any>): Promise<string> {
  console.table({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.PINATA_GATEWAY || "example-gateway.mypinata.cloud",
  });
  const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.PINATA_GATEWAY || "example-gateway.mypinata.cloud",
  });
  try {
    const upload: UploadResponse = await pinata.upload.public.json(json);
    // Return the IPFS link using the returned cid
    return `${IPFS.GATEWAY}/${upload.cid}`;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
}

export default launchPumpFunToken; 