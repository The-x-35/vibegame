"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction, Connection } from '@solana/web3.js';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { API_ENDPOINTS } from '@/global/constant';

interface FeeData {
  tx: string;
  fees: {
    curveFee: number;
    lpFee: {
      claimedFee: number;
      unclaimedFee: number;
    };
    totalFee: number;
    hasUnclaimedFees: boolean;
  };
}

interface ClaimFeesDialogProps {
  tokenMint: string;
  tokenName: string;
}

// Initialize Solana connection
const solanaConnection = new Connection(API_ENDPOINTS.SOLANA_RPC_ENDPOINT, 'confirmed');

export default function ClaimFeesDialog({ tokenMint, tokenName }: ClaimFeesDialogProps) {
  const { publicKey, signTransaction } = useWallet();
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchFeeData = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenMint,
          claimer: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch fee data');
      }

      const result = await response.json();
      console.log('📊 Fee API response:', result);
      console.log('📊 Fee data structure:', result.data);
      setFeeData(result.data);
    } catch (error) {
      console.error('Error fetching fee data:', error);
      toast.error('Failed to fetch fee data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimFees = async () => {
    if (!publicKey || !signTransaction || !feeData) {
      toast.error('Please connect your wallet to claim fees');
      return;
    }

    if (!feeData.fees.hasUnclaimedFees) {
      toast.error('No unclaimed fees available');
      return;
    }

    setIsClaiming(true);
    try {
      const txBase64 = feeData.tx;

      if (!txBase64) {
        throw new Error('No transaction available for claiming fees');
      }

      // Step 1: Sign and submit transaction
      console.log('📝 Deserializing and signing transaction...');
      const txBuffer = Buffer.from(txBase64, 'base64');
      let transaction: Transaction | VersionedTransaction;
      
      try {
        transaction = VersionedTransaction.deserialize(Uint8Array.from(txBuffer));
        
        // Update recent blockhash for VersionedTransaction
        transaction.message.recentBlockhash = (await solanaConnection.getLatestBlockhash({
          commitment: "confirmed",
        })).blockhash;
        
      } catch (e) {
        console.warn('Falling back to legacy Transaction deserialization');
        transaction = Transaction.from(txBuffer);
      }

      const signedTx = await signTransaction(transaction);

      // Step 2: Submit signed transaction directly to Solana network
      console.log('📤 Submitting signed transaction to Solana...');
      const signature = await solanaConnection.sendRawTransaction(signedTx.serialize() as Uint8Array, {
        preflightCommitment: 'processed'
      });
      
      // Wait for confirmation
      console.log('⏳ Waiting for transaction confirmation...');
      const latestBlockhash = await solanaConnection.getLatestBlockhash();
      await solanaConnection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      });

      console.log('✅ Successfully claimed fees:', signature);
      toast.success('Fees claimed successfully!');
      
      // Refresh fee data
      await fetchFeeData();

    } catch (error) {
      console.error('Error claiming fees:', error);
      toast.error(`Failed to claim fees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (publicKey && tokenMint) {
      fetchFeeData();
    }
  }, [publicKey, tokenMint]);

  const formatTokenAmount = (amount: number) => {
    return (amount / 1e9).toFixed(2); // Show only 2 decimal places
  };

  const hasUnclaimedFees = feeData && feeData.fees && feeData.fees.hasUnclaimedFees;
  const unclaimedFee = feeData?.fees?.lpFee?.unclaimedFee || 0;
  const claimedFee = feeData?.fees?.lpFee?.claimedFee || 0;
  const totalFee = unclaimedFee + claimedFee;

  if (!publicKey) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Token Fees
          </CardTitle>
          <CardDescription>
            Connect your wallet to view and claim fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <Wallet className="h-8 w-8 mx-auto mb-2" />
            <p>Wallet not connected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Token Fees
        </CardTitle>
        <CardDescription>
          View and claim fees for {tokenName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
        ) : feeData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatTokenAmount(unclaimedFee)}
                </div>
                <div className="text-sm text-muted-foreground">Unclaimed SOL</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTokenAmount(claimedFee)}
                </div>
                <div className="text-sm text-muted-foreground">Claimed SOL</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatTokenAmount(totalFee)}
                </div>
                <div className="text-sm text-muted-foreground">Total SOL</div>
              </div>
            </div>

            {feeData.fees.curveFee > 0 && (
              <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-lg font-semibold text-amber-800">
                  Curve Fee: {formatTokenAmount(feeData.fees.curveFee)} SOL
                </div>
                <div className="text-sm text-amber-600">Additional trading fee</div>
              </div>
            )}

            {hasUnclaimedFees && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    You have unclaimed fees available!
                  </span>
                </div>
                <Button
                  onClick={handleClaimFees}
                  disabled={isClaiming}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Fees'}
                </Button>
              </div>
            )}

            {!hasUnclaimedFees && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No unclaimed fees available
                </p>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Token: {tokenMint.slice(0, 8)}...{tokenMint.slice(-8)}</span>
              <Badge variant={feeData.fees.hasUnclaimedFees ? "default" : "secondary"}>
                {feeData.fees.hasUnclaimedFees ? "Unclaimed" : "No Unclaimed"}
              </Badge>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>No fee data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 