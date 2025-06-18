# Authentication System Test Guide

## How It Works

The system now supports **hybrid authentication**:
1. **JWT tokens** (preferred) - Generated when wallet connects
2. **Direct wallet authentication** (fallback) - Works with just wallet address

This means:
- ✅ Old users without JWT tokens can still like/comment
- ✅ New users get JWT tokens for better security
- ✅ No "sign in" errors - just "connect wallet" prompts

## Quick Test Steps

### 1. Test Wallet Connection & Auto-Login
1. Open the game detail page
2. Click "Connect Wallet" button
3. Connect your Solana wallet (Phantom, Solflare, etc.)
4. Check browser console for "Auto-login successful" message
5. Check localStorage for authToken

### 2. Test Like Functionality (with JWT)
1. With wallet connected and JWT token generated, try to like a game
2. Should work seamlessly
3. Try to unlike the game
4. Like count should update correctly

### 3. Test Like Functionality (without JWT)
1. Clear localStorage: `localStorage.removeItem('authToken')`
2. Try to like a game
3. Should still work (uses direct wallet auth)
4. No "sign in" errors

### 4. Test Comment Functionality
1. With wallet connected, try to post a comment
2. Should work whether you have JWT or not
3. Comment should appear in the list

### 5. Test Rate Limiting
1. Try to like the same game multiple times quickly
2. Should get rate limit error after 5 attempts
3. Wait 60 seconds and try again

### 6. Test Without Wallet
1. Disconnect wallet
2. Try to like a game
3. Should show "Please connect your wallet" message
4. Try to post a comment
5. Should show "Please connect your wallet" message

## Debug Information

### Check Authentication Status
Add this component to any page to see auth status:
```tsx
import { AuthStatus } from '@/components/auth-status';

// In your component
<AuthStatus />
```

### Check localStorage
Open browser dev tools and check:
```javascript
// Check if token exists
localStorage.getItem('authToken')

// Check token expiration
const authData = JSON.parse(localStorage.getItem('authToken'));
console.log('Token expires at:', new Date(authData.expiresAt));
```

### Check API Responses
In browser dev tools Network tab:
1. Look for `/api/auth/login` calls (when wallet connects)
2. Look for `/api/games/[id]/like` calls
3. Check if Authorization headers are present (JWT) or not (direct wallet)
4. Check response status codes

## Common Issues

### Issue: "Wallet address required" error
**Cause**: No wallet connected or wallet address missing
**Solution**: 
1. Connect your Solana wallet
2. Make sure wallet is connected before trying to like/comment

### Issue: "Rate limit exceeded" error
**Cause**: Too many requests in short time
**Solution**: Wait 60 seconds before trying again

### Issue: "Invalid request origin" error
**Cause**: CSRF protection blocking request
**Solution**: 
1. Make sure you're on the correct domain
2. Check if NODE_ENV is set correctly
3. Update domain whitelist in auth-middleware.ts

### Issue: Auto-login not working
**Cause**: Login API not responding
**Solution**:
1. Check if `/api/auth/login` endpoint exists
2. Check server logs for errors
3. Verify database connection
4. **Note**: App still works without JWT tokens

### Issue: Old users can't like/comment
**Cause**: They don't have JWT tokens
**Solution**: 
1. **This should work now!** The system accepts direct wallet authentication
2. If still having issues, check if wallet is properly connected
3. Check browser console for errors

## Environment Variables

Make sure these are set:
```env
JWT_SECRET=your-secret-key-here
NODE_ENV=development
DATABASE_URL=your-database-url
```

## Database Migration

Run this to apply security constraints:
```bash
psql $DATABASE_URL -f migrations/003_add_likes_constraints.sql
```

## Migration Path

### For Existing Users
- ✅ **No action needed** - they can continue using the app
- ✅ **JWT tokens optional** - direct wallet auth still works
- ✅ **Auto-upgrade** - they'll get JWT tokens when they reconnect wallet

### For New Users
- ✅ **Automatic JWT** - tokens generated when wallet connects
- ✅ **Better security** - rate limiting and CSRF protection
- ✅ **Seamless experience** - no additional steps required 