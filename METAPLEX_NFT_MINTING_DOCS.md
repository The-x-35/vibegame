# Metaplex NFT Minting API Documentation for Iframe Project

## Overview

This document describes how to implement Metaplex NFT minting functionality in the iframe project. The parent VibeGame application handles NFT minting using the Metaplex protocol, supporting both standalone NFTs and collection NFTs.

## Implementation for Iframe Project

### 1. Mint NFT with Metaplex

When the user wants to mint an NFT, the iframe should send a message to the parent window with the NFT metadata.

#### Message Format

```javascript
const mintNFT = async (nftData) => {
    return new Promise((resolve, reject) => {
        const requestId = `mint_${Date.now()}_${Math.random()}`;
        
        const handleResponse = (event) => {
            if (event.data.source === 'alpha-parent' && event.data.requestId === requestId) {
                window.removeEventListener('message', handleResponse);
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.result);
                }
            }
        };

        window.addEventListener('message', handleResponse);
        
        // Send mint request to parent
        window.parent.postMessage({
            source: 'alpha-iframe',
            action: 'metaplexMintNFT',
            payload: {
                name: nftData.name,           // Required: NFT name
                uri: nftData.uri,             // Required: Metadata URI
                owner: nftData.owner,         // Required: Owner's public key
                collectionMint: nftData.collectionMint, // Optional: Collection mint address
                rpcEndpoint: nftData.rpcEndpoint // Optional: RPC endpoint
            },
            requestId
        }, '*');
        
        // Timeout after 30 seconds
        setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            reject(new Error('Mint request timeout'));
        }, 30000);
    });
};
```

#### Usage Example

```javascript
// Example: Mint a standalone NFT
const mintStandaloneNFT = async () => {
    try {
        const result = await mintNFT({
            name: 'My Awesome NFT',
            uri: 'https://example.com/metadata.json',
            owner: userPublicKey, // User's public key
            rpcEndpoint: 'https://api.mainnet-beta.solana.com'
        });
        
        console.log('NFT minted successfully:', result);
        // Result: { mint: "mint_address", metadata: "metadata_address", signature: "tx_signature" }
    } catch (error) {
        console.error('Failed to mint NFT:', error);
    }
};

// Example: Mint an NFT as part of a collection
const mintCollectionNFT = async () => {
    try {
        const result = await mintNFT({
            name: 'Collection NFT #1',
            uri: 'https://example.com/collection-metadata.json',
            owner: userPublicKey,
            collectionMint: 'collection_mint_address', // Collection's master NFT address
            rpcEndpoint: 'https://api.mainnet-beta.solana.com'
        });
        
        console.log('Collection NFT minted successfully:', result);
    } catch (error) {
        console.error('Failed to mint collection NFT:', error);
    }
};
```

## Parent Integration Guide

The parent (host) application handles the actual NFT minting logic using Metaplex/UMI. The implementation supports both standalone NFTs and collection NFTs.

### Supported Features

1. **Standalone NFT Minting**: Mint individual NFTs not part of a collection
2. **Collection NFT Minting**: Mint NFTs as part of an existing collection
3. **Custom Metadata**: Support for name, symbol, URI, and other metadata
4. **Royalty Support**: Default 5% royalty to the creator
5. **Creator Verification**: Automatic creator verification for the minting wallet

### Response Format

The parent application responds with:

```javascript
// Success response
{
    source: 'alpha-parent',
    requestId: 'request_id',
    result: {
        mint: 'mint_address',           // The NFT's mint address
        metadata: 'metadata_address',    // The metadata account address
        signature: 'transaction_signature' // The transaction signature
    }
}

// Error response
{
    source: 'alpha-parent',
    requestId: 'request_id',
    error: 'Error message'
}
```

### Required Parameters

- `name`: NFT name (string, required)
- `uri`: Metadata URI (string, required)
- `owner`: Owner's public key (string, required)
- `collectionMint`: Collection mint address (string, optional)
- `rpcEndpoint`: RPC endpoint (string, optional)

### Error Handling

The parent application validates all required parameters and returns appropriate error messages:

- Missing required parameters
- Wallet not connected
- Invalid public keys
- Transaction failures
- Network errors

## Security Notes

- All blockchain operations are performed in the parent context
- Private keys are never exposed to the iframe
- User authentication is handled by the connected wallet
- All transactions are signed by the user's wallet

## Testing

Use the test interface in the parent application to verify NFT minting functionality:

1. Connect a wallet
2. Click "7. metaplexMintNFT" to test standalone NFT minting
3. Check the test results for success/error messages

## Integration with Alpha

The iframe project can now use the `[METAPLEX] Mint NFT` block to mint NFTs:

```
[METAPLEX] Mint NFT with [name], [uri], [symbol], Decimals [decimals], Supply [supply]
```

The block will automatically:
1. Get the user's public key from the parent
2. Send the mint request with all parameters
3. Return the mint address and transaction signature
4. Handle errors gracefully

## Notes & Best Practices

- Always validate metadata URIs before minting
- Use appropriate royalty percentages for your project
- Consider gas fees when minting multiple NFTs
- Test on devnet before mainnet deployment
- Follow Metaplex metadata standards for compatibility
- Handle collection verification properly for collection NFTs

See also: Solana and Jupiter extension docs for more parent integration patterns. 