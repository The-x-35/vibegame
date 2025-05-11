"use client";

import { Keypair, VersionedTransaction, Connection } from '@solana/web3.js';
import { Buffer } from 'buffer';

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
  signEndpoint = 'https://mrgbnbr5uk.execute-api.eu-central-1.amazonaws.com/transactions/initiate-sign',
  solanaRpcEndpoint = 'https://api.mainnet-beta.solana.com',
}: LaunchPumpFunTokenArgs): Promise<string> {
  // Upload metadata to IPFS via pump.fun
  const formData = new URLSearchParams();
  formData.append('name', tokenName);
  formData.append('symbol', tokenTicker);
  formData.append('description', tokenDescription);
  formData.append('showName', 'true');
  if (tokenTwitter) formData.append('twitter', tokenTwitter);
  if (tokenTelegram) formData.append('telegram', tokenTelegram);
  if (tokenWebsite) formData.append('website', tokenWebsite);

  const imageRes = await fetch(imageUrl);
  const imageBlob = await imageRes.blob();
  const files = { file: new File([imageBlob], 'token_image.png', { type: 'image/png' }) };

  const finalFormData = new FormData();
  formData.forEach((val, key) => finalFormData.append(key, val));
  if (files.file) finalFormData.append('file', files.file);

  const metadataResponse = await fetch('https://pump.fun/api/ipfs', { method: 'POST', body: finalFormData });
  if (!metadataResponse.ok) {
    throw new Error(`Metadata upload failed: ${metadataResponse.statusText}`);
  }
  const metadataJson = await metadataResponse.json();

  // Generate mint keypair and create on-chain transaction via pump portal
  const mintKeypair = Keypair.generate();
  const payload = {
    publicKey: (window as any).solana.publicKey.toBase58(),
    action: 'create',
    tokenMetadata: {
      name: metadataJson.metadata.name,
      symbol: metadataJson.metadata.symbol,
      uri: metadataJson.metadataUri,
    },
    mint: mintKeypair.publicKey.toBase58(),
    denominatedInSol: 'true',
    pool: 'pump',
  };

  const txResponse = await fetch('https://pumpportal.fun/api/trade-local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!txResponse.ok) {
    const errText = await txResponse.text();
    throw new Error(`Transaction creation failed: ${txResponse.status} - ${errText}`);
  }

  const txData = await txResponse.arrayBuffer();
  const tx = VersionedTransaction.deserialize(new Uint8Array(txData));

  // Sign via backend
  const connection = new Connection(solanaRpcEndpoint, 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();
  tx.message.recentBlockhash = blockhash;

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
}

export default launchPumpFunToken; 