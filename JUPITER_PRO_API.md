# Jupiter Pro API Implementation

## Environment Variables Required

Add the following to your `.env` file:

```env
JUPITER_API_KEY=your_jupiter_pro_api_key_here
```

## Changes Made

### 1. **Constants Updated**
- Added `JUP_REFERRAL_FEE = 100` (1% referral fee)
- Fixed typo: `RERERRAL_FEE` → `REFERRAL_FEE`

### 2. **Pro API Features Added**
- **API Key Authentication**: All requests now include `x-api-key` header
- **Referral Program**: Automatic referral fees (1%) to support the platform
- **Better Error Handling**: Specific error messages for insufficient funds and route not found
- **Transaction Execution**: Proper execution flow with `/execute` endpoint

### 3. **Enhanced Error Handling**
- Route not found (400 errors)
- Insufficient funds detection
- Missing transaction validation
- API key validation

## Usage Flow

### For Buy/Sell Operations:

1. **Initial Request** (Create Order):
   ```javascript
   const response = await fetch('/api/jupiter/buy', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       amount: 0.1, // Amount in tokens
       outputMint: 'token_mint_address',
       wallet: 'user_wallet_public_key'
     })
   });
   
   const { transactionHex, requestId } = await response.json();
   ```

2. **Sign Transaction** (Client-side):
   ```javascript
   // Convert hex back to transaction and sign with wallet
   const transaction = VersionedTransaction.deserialize(
     Buffer.from(transactionHex, 'hex')
   );
   const signedTx = await wallet.signTransaction(transaction);
   const signedBase64 = Buffer.from(signedTx.serialize()).toString('base64');
   ```

3. **Execute Transaction**:
   ```javascript
   const executeResponse = await fetch('/api/jupiter/buy', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       signedTransaction: signedBase64,
       requestId: requestId
     })
   });
   
   const { signature } = await executeResponse.json();
   ```

## Benefits of Pro API

1. **Priority Access**: Faster route discovery and execution
2. **Better Rates**: Access to more liquidity sources
3. **Referral Earnings**: Earn fees from user transactions
4. **Enhanced Support**: Better error messages and debugging

## Migration from Free API

The implementation is backwards compatible. The main differences:
- Requires `JUPITER_API_KEY` environment variable
- Adds referral parameters automatically
- Better error handling and validation
- Two-step process: order creation → signing → execution

## Error Messages

- `"Jupiter API key not configured"` - Add `JUPITER_API_KEY` to environment
- `"Route not found"` - No trading route available for the token pair
- `"You have insufficient funds"` - Wallet doesn't have enough tokens
- `"Swap transaction not found"` - Jupiter didn't return a valid transaction 