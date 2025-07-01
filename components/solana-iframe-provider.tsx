'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { 
    PublicKey, 
    VersionedTransaction, 
    Connection, 
    Transaction, 
    SystemProgram,
    LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getMint
} from '@solana/spl-token';
import { useWallet, Wallet } from '@solana/wallet-adapter-react';

interface SolanaIframeContextType {
    wallet: Wallet | null;
    publicKey: PublicKey | null;
    connected: boolean;
}

const SolanaIframeContext = createContext<SolanaIframeContextType | undefined>(undefined);

interface SolanaIframeProviderProps {
    children: ReactNode;
}

export function SolanaIframeProvider({ children }: SolanaIframeProviderProps) {
    const { wallet, publicKey, signTransaction: walletSignTransaction, connected } = useWallet();

    const handleIframeMessage = async (event: MessageEvent) => {
        console.log('🚀 NEW VERSION LOADED:', new Date().toISOString());
        
        const { data, source } = event;
        
        // Only handle alpha-iframe messages
        if (!data || data.source !== 'alpha-iframe') return;

        const { action, payload, requestId } = data;

        console.log('🎯 Parent wallet received message from iframe:');
        console.log('📥 Action:', action);
        console.log('🆔 Request ID:', requestId);
        console.log('📦 Payload keys:', Object.keys(payload || {}));
        console.log('📊 Full payload:', payload);

        const reply = (result: any, error?: string) => {
            if (source) {
                const response = {
                    source: 'alpha-parent',
                    requestId,
                    result,
                    error
                };
                console.log('📤 Sending response to iframe:', response);
                (source as Window).postMessage(response, '*');
            }
        };

        try {
            let result: any;
            
            console.log('🔍 DEBUG: Switch statement reached with action:', action);

            switch (action) {
                case 'getPublicKey':
                    try {
                        if (!publicKey) {
                            throw new Error('No wallet connected');
                        }
                        const publicKeyString = publicKey.toString();
                        console.log('✅ getPublicKey: Returning public key:', publicKeyString);
                        result = { publicKey: publicKeyString };
                    } catch (error) {
                        console.error('❌ getPublicKey: Error getting public key:', error);
                        throw error;
                    }
                    break;
                    
                case 'solanaTransferSol':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { fromPubkey, toPubkey, amount, rpcEndpoint } = payload;
                        console.log('🔄 solanaTransferSol: Starting SOL transfer');
                        console.log('📊 solanaTransferSol: Transfer details:', { fromPubkey, toPubkey, amount, rpcEndpoint });
                        
                        const connection = new Connection(rpcEndpoint || 'https://flying-torrie-fast-mainnet.helius-rpc.com');
                        const fromKey = new PublicKey(fromPubkey);
                        const toKey = new PublicKey(toPubkey);
                        
                        // Create SOL transfer transaction
                        const transaction = new Transaction().add(
                            SystemProgram.transfer({
                                fromPubkey: fromKey,
                                toPubkey: toKey,
                                lamports: Math.floor(amount * LAMPORTS_PER_SOL)
                            })
                        );
                        
                        // Set recent blockhash and fee payer
                        const { blockhash } = await connection.getLatestBlockhash();
                        transaction.recentBlockhash = blockhash;
                        transaction.feePayer = fromKey;
                        
                        // Sign transaction
                        console.log('🖊️ solanaTransferSol: Signing SOL transfer transaction...');
                        const signedTransaction = await walletSignTransaction(transaction as any);
                        
                        // Send transaction
                        console.log('📤 solanaTransferSol: Sending SOL transfer transaction...');
                        const signature = await connection.sendTransaction(signedTransaction);
                        
                        // Wait for confirmation
                        const latestBlockhash = await connection.getLatestBlockhash();
                        await connection.confirmTransaction({
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                        });
                        
                        console.log('🎉 solanaTransferSol: SOL transfer completed:', signature);
                        result = { signature };
                    } catch (error) {
                        console.error('💥 solanaTransferSol: SOL transfer error:', error);
                        throw error;
                    }
                    break;
                    
                case 'solanaTransferToken':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { fromPubkey, toPubkey, mint, amount, rpcEndpoint } = payload;
                        console.log('🔄 solanaTransferToken: Starting token transfer');
                        console.log('📊 solanaTransferToken: Transfer details:', { fromPubkey, toPubkey, mint, amount, rpcEndpoint });
                        
                        const connection = new Connection(rpcEndpoint || 'https://flying-torrie-fast-mainnet.helius-rpc.com');
                        const fromKey = new PublicKey(fromPubkey);
                        const toKey = new PublicKey(toPubkey);
                        const mintKey = new PublicKey(mint);
                        
                        // Get Associated Token Addresses
                        const fromAta = await getAssociatedTokenAddress(mintKey, fromKey);
                        const toAta = await getAssociatedTokenAddress(mintKey, toKey);
                        
                        // Check if ATAs exist
                        const [fromAtaInfo, toAtaInfo] = await Promise.all([
                            connection.getAccountInfo(fromAta),
                            connection.getAccountInfo(toAta)
                        ]);
                        
                        const transaction = new Transaction();
                        
                        // Create recipient's ATA if it doesn't exist
                        if (!toAtaInfo) {
                            console.log('🏗️ solanaTransferToken: Creating ATA for recipient...');
                            transaction.add(
                                createAssociatedTokenAccountInstruction(
                                    fromKey,  // payer
                                    toAta,    // ATA address
                                    toKey,    // owner
                                    mintKey   // mint
                                )
                            );
                        }
                        
                        // Create sender's ATA if it doesn't exist
                        if (!fromAtaInfo) {
                            console.log('🏗️ solanaTransferToken: Creating ATA for sender...');
                            transaction.add(
                                createAssociatedTokenAccountInstruction(
                                    fromKey,  // payer
                                    fromAta,  // ATA address
                                    fromKey,  // owner
                                    mintKey   // mint
                                )
                            );
                        }
                        
                        // Get token decimals and adjust amount
                        const mintInfo = await getMint(connection, mintKey);
                        const adjustedAmount = Math.floor(amount * Math.pow(10, mintInfo.decimals));
                        console.log('🔢 solanaTransferToken: Adjusted amount with decimals:', adjustedAmount);
                        
                        // Add transfer instruction
                        transaction.add(
                            createTransferInstruction(
                                fromAta,        // source
                                toAta,          // destination
                                fromKey,        // owner
                                adjustedAmount  // amount
                            )
                        );
                        
                        // Set recent blockhash and fee payer
                        const { blockhash } = await connection.getLatestBlockhash();
                        transaction.recentBlockhash = blockhash;
                        transaction.feePayer = fromKey;
                        
                        // Sign transaction
                        console.log('🖊️ solanaTransferToken: Signing token transfer transaction...');
                        const signedTransaction = await walletSignTransaction(transaction as any);
                        
                        // Send transaction
                        console.log('📤 solanaTransferToken: Sending token transfer transaction...');
                        const signature = await connection.sendTransaction(signedTransaction);
                        
                        // Wait for confirmation
                        const latestBlockhash = await connection.getLatestBlockhash();
                        await connection.confirmTransaction({
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                        });
                        
                        console.log('🎉 solanaTransferToken: Token transfer completed:', signature);
                        result = { signature };
                    } catch (error) {
                        console.error('💥 solanaTransferToken: Token transfer error:', error);
                        throw error;
                    }
                    break;
                    
                case 'jupiterSwap':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { swapTransaction, userPublicKey, rpcEndpoint } = payload;
                        console.log('Jupiter swap with RPC:', rpcEndpoint);
                        
                        // Deserialize the VersionedTransaction
                        const swapTransactionBuf = Uint8Array.from(Buffer.from(swapTransaction, 'base64'));
                        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
                        
                        // Sign the transaction with your wallet
                        console.log('Signing Jupiter swap transaction...');
                        const signedTransaction = await walletSignTransaction(transaction);
                        
                        // Send the transaction using the provided RPC endpoint
                        const connection = new Connection(rpcEndpoint || 'https://flying-torrie-fast-mainnet.helius-rpc.com');
                        console.log('Sending Jupiter swap transaction...');
                        const signature = await connection.sendTransaction(signedTransaction);
                        
                        // Wait for confirmation
                        const latestBlockhash = await connection.getLatestBlockhash();
                        await connection.confirmTransaction({
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                        });
                        
                        console.log('Jupiter swap completed:', signature);
                        result = { signature };
                    } catch (error) {
                        console.error('Jupiter swap error:', error);
                        throw error;
                    }
                    break;
                    
                case 'jupiterStake':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { transaction: transactionBase64, userPublicKey, rpcEndpoint } = payload;
                        console.log('Jupiter stake with RPC:', rpcEndpoint);
                        
                        // Deserialize the VersionedTransaction
                        const transactionBuf = Uint8Array.from(Buffer.from(transactionBase64, 'base64'));
                        const versionedTransaction = VersionedTransaction.deserialize(transactionBuf);
                        
                        // Update the recent blockhash
                        const connection = new Connection(rpcEndpoint || 'https://flying-torrie-fast-mainnet.helius-rpc.com');
                        const { blockhash } = await connection.getLatestBlockhash();
                        versionedTransaction.message.recentBlockhash = blockhash;
                        
                        // Sign the transaction with your wallet
                        console.log('Signing Jupiter stake transaction...');
                        const signedTransaction = await walletSignTransaction(versionedTransaction);
                        
                        // Send the transaction
                        console.log('Sending Jupiter stake transaction...');
                        const signature = await connection.sendTransaction(signedTransaction);
                        
                        // Wait for confirmation
                        const latestBlockhash = await connection.getLatestBlockhash();
                        await connection.confirmTransaction({
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                        });
                        
                        console.log('Jupiter stake completed:', signature);
                        result = { signature };
                    } catch (error) {
                        console.error('Jupiter stake error:', error);
                        throw error;
                    }
                    break;
                    
                default:
                    console.warn('Unknown action:', action);
                    throw new Error(`Unknown action: ${action}`);
            }

            // Send success response
            reply(result);
            
        } catch (error) {
            console.error('Iframe wallet action error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            reply(null, errorMessage);
        }
    };

    useEffect(() => {
        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, [publicKey, walletSignTransaction, connected]);

    return (
        <SolanaIframeContext.Provider value={{ 
            wallet, 
            publicKey, 
            connected
        }}>
            {children}
        </SolanaIframeContext.Provider>
    );
}

export const useSolanaIframe = () => {
    const context = useContext(SolanaIframeContext);
    if (context === undefined) {
        throw new Error('useSolanaIframe must be used within a SolanaIframeProvider');
    }
    return context;
}; 