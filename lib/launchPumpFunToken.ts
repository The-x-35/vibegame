"use client";

import { Keypair, VersionedTransaction, TransactionMessage, PublicKey, Connection } from "@solana/web3.js";
import { BN } from "bn.js";
import { WALLET, API_ENDPOINTS } from "@/global/constant";
import { PumpSdk, getBuySolAmountFromTokenAmount } from "@pump-fun/pump-sdk";
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
  amount: number;
}

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
  if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
    throw new Error("NEXT_PUBLIC_PINATA_JWT is not set in environment variables");
  }

  console.table({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "example-gateway.mypinata.cloud",
  });

  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "example-gateway.mypinata.cloud",
  });

  try {
    // Validate JSON before upload
    if (!json.name || !json.symbol || !json.description || !json.image) {
      throw new Error("Missing required metadata fields: name, symbol, description, or image");
    }

    // Test Pinata connection
    try {
      const testResponse = await fetch("https://api.pinata.cloud/data/testAuthentication", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      });
      
      if (!testResponse.ok) {
        throw new Error(`Pinata authentication failed: ${testResponse.statusText}`);
      }
      console.log("Pinata authentication successful");
    } catch (error) {
      console.error("Pinata authentication error:", error);
      throw new Error("Failed to authenticate with Pinata. Please check your JWT token.");
    }

    const upload: UploadResponse = await pinata.upload.public.json(json);
    console.log("Pinata upload successful:", upload);
    return `https://ipfs.io/ipfs/${upload.cid}`;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    if (error instanceof Error) {
      throw new Error(`Pinata upload failed: ${error.message}`);
    }
    throw error;
  }
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
  amount,
}: LaunchPumpFunTokenArgs): Promise<string> {
  try {
    console.log("=== Starting Token Launch ===");
    console.log("Input Parameters:", {
      imageUrl,
      tokenName,
      tokenTicker,
      tokenDescription,
      tokenTelegram,
      tokenTwitter,
      tokenWebsite,
      amount,
      appTokenLength: appToken?.length
    });

    console.log("=== Connection Setup ===");
    console.log("RPC Endpoint:", API_ENDPOINTS.SOLANA_RPC_ENDPOINT);
    const connection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');
    const pumpSdk = new PumpSdk(connection);
    
    console.log("=== Mint Generation ===");
    const mint = Keypair.generate();
    console.log("Mint Public Key:", mint.publicKey.toBase58());
    console.log("Mint Secret Key Length:", mint.secretKey.length);

    console.log("=== Metadata Creation ===");
    const metadata = {
      name: tokenName,
      symbol: tokenTicker,
      description: tokenDescription,
      showName: true,
      createdOn: "https://www.sendai.fun",
      image: imageUrl,
      twitter: tokenTwitter,
      telegram: tokenTelegram,
      website: tokenWebsite,
    };
    console.log("Token Metadata:", metadata);

    console.log("=== Uploading Metadata to Pinata ===");
    const metadataUri = await uploadJsonToPinata(metadata);
    console.log("Metadata URI:", metadataUri);

    console.log("=== Creating Instructions ===");
    console.log("Wallet Address:", WALLET.toBase58());
    const ix = await pumpSdk.createInstruction(mint.publicKey, metadata.name, metadata.symbol, metadataUri, WALLET, WALLET);
    console.log("Create Instruction:", ix);

    console.log("=== Fetching Global State ===");
    const global = await pumpSdk.fetchGlobal();
    console.log("Global State:", global);

    console.log("=== Setting Up Bonding Curve ===");
    const bondingCurve = {
      virtualTokenReserves: global.initialVirtualTokenReserves,
      virtualSolReserves: global.initialVirtualSolReserves,
      realTokenReserves: global.initialRealTokenReserves,
      realSolReserves: new BN(0),
      tokenTotalSupply: new BN(global.tokenTotalSupply),
      complete: false,
      creator: WALLET,
    };
    console.log("Bonding Curve:", bondingCurve);

    console.log("=== Calculating Buy Amount ===");
    const amountInLamports = new BN(amount * 1e9); // Convert SOL to lamports
    const buy_sol_amount = getBuySolAmountFromTokenAmount(global, bondingCurve, amountInLamports, true);
    console.log("Buy SOL Amount:", buy_sol_amount.toString());

    console.log("=== Creating Buy Instructions ===");
    const buy_ix = await pumpSdk.buyInstructions(global, null, bondingCurve, mint.publicKey, WALLET, amountInLamports, buy_sol_amount, 1, WALLET);
    console.log("Buy Instructions:", buy_ix);

    console.log("=== Getting Latest Blockhash ===");
    const { blockhash } = await connection.getLatestBlockhash();
    console.log("Blockhash:", blockhash);

    console.log("=== Creating Transaction Message ===");
    const messageV0 = new TransactionMessage({
      payerKey: WALLET,
      recentBlockhash: blockhash,
      instructions: [ix, ...buy_ix],
    }).compileToV0Message();
    console.log("Message V0:", messageV0);

    console.log("=== Creating Transaction ===");
    const tx = new VersionedTransaction(messageV0);
    // Don't sign here, let the signing service handle it
    console.log("Transaction Created");

    console.log("=== Serializing Transaction ===");
    const serializedTx = tx.serialize();
    const encodedTx = Buffer.from(serializedTx).toString('base64');
    console.log('Base64 encoded transaction:', encodedTx);

    console.log("=== Converting to Hex ===");
    const transactionBuffer = Buffer.from(encodedTx, 'base64');
    const transactionHex = transactionBuffer.toString('hex');
    console.log('Transaction Hex:', transactionHex);

    console.log("=== Sending to Sign Route ===");
    const signRes = await fetch('/api/transactions/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appToken}`,
      },
      body: JSON.stringify({ 
        transactionHex,
        commitment: 'confirmed',
        maxRetries: 3
      }),
    });

    const signResult = await signRes.json();
    console.log("Sign Result:", signResult);
    if (!signRes.ok) {
      throw new Error(signResult.error || 'Failed to sign transaction');
    }

    // Wait for confirmation
    if (signResult.transactionId) {
      console.log("Waiting for transaction confirmation...");
      const confirmation = await connection.confirmTransaction({
        signature: signResult.transactionId,
        blockhash: blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      console.log("Transaction confirmed!");
    }

    console.log("=== Token Launch Complete ===");
    return mint.publicKey.toBase58();
  } catch (error) {
    console.error("=== Error in launchPumpFunToken ===");
    console.error("Error:", error);
    if (error instanceof Error && "logs" in error) {
      console.error("Transaction logs:", (error as any).logs);
    }
    throw error;
  }
}

export default launchPumpFunToken; 