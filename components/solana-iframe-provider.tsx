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

// Metaplex cNFT imports
import { 
    createTree,
    mplBubblegum,
    mintToCollectionV1,
} from '@metaplex-foundation/mpl-bubblegum';
import {
    createNft,
    mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { 
    generateSigner,
    percentAmount,
    publicKey as umiPublicKey,
    none,
} from '@metaplex-foundation/umi';

interface SolanaIframeContextType {
    wallet: Wallet | null;
    publicKey: PublicKey | null;
    connected: boolean;
}

const SolanaIframeContext = createContext<SolanaIframeContextType | undefined>(undefined);

interface SolanaIframeProviderProps {
    children: ReactNode;
}

// cNFT Helper Functions
async function createCnftCollection({ 
    payer, 
    name, 
    symbol, 
    uri, 
    maxDepth, 
    maxBufferSize, 
    rpcEndpoint,
    wallet
}: {
    payer: string;
    name: string;
    symbol: string;
    uri: string;
    maxDepth: number;
    maxBufferSize: number;
    rpcEndpoint: string;
    wallet: any;
}) {
    // Ensure wallet is connected
    if (!wallet.connected) {
        await wallet.connect();
    }

    const umi = createUmi(rpcEndpoint)
        .use(mplBubblegum())
        .use(mplTokenMetadata())
        .use(walletAdapterIdentity(wallet));

    // Generate signers for tree and collection
    const merkleTree = generateSigner(umi);
    const collectionMint = generateSigner(umi);

    // Create the collection NFT first
    const createCollectionTx = await createNft(umi, {
        mint: collectionMint,
        name,
        symbol,
        uri,
        sellerFeeBasisPoints: percentAmount(0), // 0% royalty
        isCollection: true,
        creators: [
            {
                address: umi.identity.publicKey,
                verified: true,
                share: 100,
            },
        ],
    });

    await createCollectionTx.sendAndConfirm(umi);

    // Create the Merkle tree
    const createTreeTx = await createTree(umi, {
        merkleTree,
        maxDepth,
        maxBufferSize,
        canopyDepth: Math.min(maxDepth - 3, 17), // Recommended canopy depth
    });

    const treeResult = await createTreeTx.sendAndConfirm(umi);

    return {
        treeAddress: merkleTree.publicKey.toString(),
        collectionMint: collectionMint.publicKey.toString(),
        signature: treeResult.signature.toString(),
    };
}

async function mintCnft({ 
    payer, 
    recipient, 
    name, 
    symbol, 
    uri, 
    treeAddress, 
    collectionMint, 
    rpcEndpoint,
    wallet
}: {
    payer: string;
    recipient: string;
    name: string;
    symbol: string;
    uri: string;
    treeAddress: string;
    collectionMint?: string;
    rpcEndpoint: string;
    wallet: any;
}) {
    // Ensure wallet is connected
    if (!wallet.connected) {
        await wallet.connect();
    }

    const umi = createUmi(rpcEndpoint)
        .use(mplBubblegum())
        .use(walletAdapterIdentity(wallet));

    const leafOwner = umiPublicKey(recipient);
    const merkleTree = umiPublicKey(treeAddress);
    
    let result;
    
    if (collectionMint) {
        // Mint to collection using the correct Metaplex pattern
        const mintTx = await mintToCollectionV1(umi, {
            leafOwner,
            merkleTree,
            collectionMint: umiPublicKey(collectionMint),
            metadata: {
                name,
                symbol,
                uri,
                sellerFeeBasisPoints: 500, // 5%
                collection: { key: umiPublicKey(collectionMint), verified: false },
                creators: [
                    {
                        address: umi.identity.publicKey,
                        verified: true,
                        share: 100,
                    },
                ],
            },
        });

        result = await mintTx.sendAndConfirm(umi);
    } else {
        throw new Error('Collection minting is required for this implementation');
    }

    // Generate a placeholder asset ID (in practice, you'd use parseLeafFromMintToCollectionV1Transaction)
    const assetId = generateSigner(umi).publicKey.toString();

    return {
        signature: result.signature.toString(),
        assetId,
    };
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
                    
                case 'solanaCreateCnftCollection':
                    try {
                        if (!wallet || !connected || !publicKey) {
                            throw new Error('Wallet not connected. Please connect your wallet first.');
                        }

                        const { payerPubkey, name, symbol, uri, maxDepth, maxBufferSize, rpcEndpoint } = payload;
                        
                        result = await createCnftCollection({
                            payer: payerPubkey,
                            name,
                            symbol,
                            uri,
                            maxDepth,
                            maxBufferSize,
                            rpcEndpoint,
                            wallet
                        });
                    } catch (error) {
                        throw error;
                    }
                    break;
                    
                case 'solanaMintCnft':
                    try {
                        if (!wallet || !connected || !publicKey) {
                            throw new Error('Wallet not connected. Please connect your wallet first.');
                        }

                        const { payerPubkey, recipientPubkey, name, symbol, uri, treeAddress, collectionMint, rpcEndpoint } = payload;
                        
                        result = await mintCnft({
                            payer: payerPubkey,
                            recipient: recipientPubkey,
                            name,
                            symbol,
                            uri,
                            treeAddress,
                            collectionMint,
                            rpcEndpoint,
                            wallet
                        });
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
                    // Unknown action - let other providers handle it
                    return;
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
    }, [publicKey, walletSignTransaction, connected, wallet]);

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