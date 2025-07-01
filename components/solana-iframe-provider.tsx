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
    createBurnInstruction,
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
        const { data, source } = event;
        
        // Only handle alpha-iframe messages
        if (!data || data.source !== 'alpha-iframe') return;

        const { action, payload, requestId } = data;

        console.log('🎯 Parent wallet received message from iframe:');
        console.log('📥 Action:', action);
        console.log('🆔 Request ID:', requestId);

        const reply = (result: any, error?: string) => {
            if (source) {
                const response = {
                    source: 'alpha-parent',
                    requestId,
                    result,
                    error
                };
                (source as Window).postMessage(response, '*');
            }
        };

        try {
            let result: any;

            switch (action) {
                case 'getPublicKey':
                    try {
                        if (!publicKey) {
                            throw new Error('No wallet connected');
                        }
                        const publicKeyString = publicKey.toString();
                        result = { publicKey: publicKeyString };
                    } catch (error) {
                        throw error;
                    }
                    break;
                    
                case 'solanaTransferSol':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { fromPubkey, toPubkey, amount, rpcEndpoint } = payload;
                        
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
                        const signedTransaction = await walletSignTransaction(transaction as any);
                        
                        // Send transaction
                        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                            preflightCommitment: 'processed'
                        });
                        
                        // Wait for confirmation
                        const latestBlockhash = await connection.getLatestBlockhash();
                        await connection.confirmTransaction({
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                        });
                        
                        result = { signature };
                    } catch (error) {
                        throw error;
                    }
                    break;
                    
                case 'solanaTransferToken':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { fromPubkey, toPubkey, mint, amount, rpcEndpoint } = payload;
                        
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
                        
                        // Only add transfer instruction if we have a positive amount
                        if (adjustedAmount > 0) {
                            // Add transfer instruction
                            transaction.add(
                                createTransferInstruction(
                                    fromAta,        // source
                                    toAta,          // destination
                                    fromKey,        // owner
                                    adjustedAmount  // amount
                                )
                            );
                        }
                        
                        // Set recent blockhash and fee payer
                        const { blockhash } = await connection.getLatestBlockhash();
                        transaction.recentBlockhash = blockhash;
                        transaction.feePayer = fromKey;
                        
                        // Validate transaction has instructions
                        if (transaction.instructions.length === 0) {
                            result = { signature: 'no-transaction-needed' };
                        } else {
                            // Sign transaction
                            const signedTransaction = await walletSignTransaction(transaction as any);
                            
                            // Send transaction
                            const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                                preflightCommitment: 'processed'
                            });
                            
                            // Wait for confirmation
                            const latestBlockhash = await connection.getLatestBlockhash();
                            await connection.confirmTransaction({
                                signature,
                                blockhash: latestBlockhash.blockhash,
                                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                            });
                            
                            result = { signature };
                        }
                    } catch (error) {
                        throw error;
                    }
                    break;
                    
                case 'solanaBurnToken':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { ownerPubkey, mint, amount, rpcEndpoint } = payload;
                        
                        const connection = new Connection(rpcEndpoint || 'https://flying-torrie-fast-mainnet.helius-rpc.com');
                        const ownerKey = new PublicKey(ownerPubkey);
                        const mintKey = new PublicKey(mint);
                        
                        // Get the owner's Associated Token Address
                        const ownerAta = await getAssociatedTokenAddress(mintKey, ownerKey);
                        
                        // Check if the token account exists
                        const ataInfo = await connection.getAccountInfo(ownerAta);
                        
                        const transaction = new Transaction();
                        
                        // Create owner's ATA if it doesn't exist
                        if (!ataInfo) {
                            transaction.add(
                                createAssociatedTokenAccountInstruction(
                                    ownerKey,  // payer
                                    ownerAta,  // ATA address
                                    ownerKey,  // owner
                                    mintKey    // mint
                                )
                            );
                        }
                        
                        // Get token decimals and adjust amount
                        const mintInfo = await getMint(connection, mintKey);
                        const adjustedAmount = Math.floor(amount * Math.pow(10, mintInfo.decimals));
                        
                        // Only add burn instruction if we actually have an amount to burn
                        if (adjustedAmount > 0) {
                            // Add burn instruction
                            transaction.add(
                                createBurnInstruction(
                                    ownerAta,       // token account to burn from
                                    mintKey,        // mint address
                                    ownerKey,       // owner of the token account
                                    adjustedAmount  // amount to burn (adjusted for decimals)
                                )
                            );
                        }
                        
                        // Set recent blockhash and fee payer
                        const { blockhash } = await connection.getLatestBlockhash();
                        transaction.recentBlockhash = blockhash;
                        transaction.feePayer = ownerKey;
                        
                        // Validate transaction has instructions
                        if (transaction.instructions.length === 0) {
                            result = { signature: 'no-transaction-needed' };
                        } else {
                            // Sign transaction
                            const signedTransaction = await walletSignTransaction(transaction as any);
                            
                            // Send transaction
                            const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                                preflightCommitment: 'processed'
                            });
                            
                            // Wait for confirmation
                            const latestBlockhash = await connection.getLatestBlockhash();
                            await connection.confirmTransaction({
                                signature,
                                blockhash: latestBlockhash.blockhash,
                                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                            });
                            
                            result = { signature };
                        }
                    } catch (error) {
                        throw error;
                    }
                    break;
                    
                case 'jupiterSwap':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { swapTransaction, userPublicKey, rpcEndpoint } = payload;
                        
                        // Deserialize the VersionedTransaction
                        const swapTransactionBuf = Uint8Array.from(Buffer.from(swapTransaction, 'base64'));
                        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
                        
                        // Sign the transaction with your wallet
                        const signedTransaction = await walletSignTransaction(transaction);
                        
                        // Send the transaction using the provided RPC endpoint
                        const connection = new Connection(rpcEndpoint || 'https://flying-torrie-fast-mainnet.helius-rpc.com');
                        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                            preflightCommitment: 'processed'
                        });
                        
                        // Wait for confirmation
                        const latestBlockhash = await connection.getLatestBlockhash();
                        await connection.confirmTransaction({
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                        });
                        
                        result = { signature };
                    } catch (error) {
                        throw error;
                    }
                    break;
                    
                case 'jupiterStake':
                    try {
                        if (!walletSignTransaction) {
                            throw new Error('No wallet connected');
                        }

                        const { transaction: transactionBase64, userPublicKey, rpcEndpoint } = payload;
                        
                        // Deserialize the VersionedTransaction
                        const transactionBuf = Uint8Array.from(Buffer.from(transactionBase64, 'base64'));
                        const versionedTransaction = VersionedTransaction.deserialize(transactionBuf);
                        
                        // Update the recent blockhash
                        const connection = new Connection(rpcEndpoint || 'https://flying-torrie-fast-mainnet.helius-rpc.com');
                        const { blockhash } = await connection.getLatestBlockhash();
                        versionedTransaction.message.recentBlockhash = blockhash;
                        
                        // Sign the transaction with your wallet
                        const signedTransaction = await walletSignTransaction(versionedTransaction);
                        
                        // Send the transaction
                        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                            preflightCommitment: 'processed'
                        });
                        
                        // Wait for confirmation
                        const latestBlockhash = await connection.getLatestBlockhash();
                        await connection.confirmTransaction({
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                        });
                        
                        result = { signature };
                    } catch (error) {
                        throw error;
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            // Send success response
            reply(result);
            
        } catch (error) {
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