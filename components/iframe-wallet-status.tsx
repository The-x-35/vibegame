'use client';

import { useState } from 'react';
import { useSolanaIframe } from './solana-iframe-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function IframeWalletStatus() {
    const { wallet, publicKey, connected } = useSolanaIframe();
    const [isLoading, setIsLoading] = useState(false);
    const [rpcEndpoint, setRpcEndpoint] = useState('https://flying-torrie-fast-mainnet.helius-rpc.com');
    const [testResults, setTestResults] = useState<Record<string, any>>({});

    const sendMessageToParent = (action: string, payload: any = {}): Promise<any> => {
        return new Promise((resolve, reject) => {
            const requestId = `test_${Date.now()}_${Math.random()}`;
            
            const handleResponse = (event: MessageEvent) => {
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
            
            window.parent.postMessage({
                source: 'alpha-iframe',
                action,
                payload: { ...payload, rpcEndpoint },
                requestId
            }, '*');
            
            // Timeout after 30 seconds
            setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                reject(new Error('Request timeout'));
            }, 30000);
        });
    };

    const testGetPublicKey = async () => {
        setIsLoading(true);
        try {
            const result = await sendMessageToParent('getPublicKey', {}) as { publicKey: string };
            setTestResults(prev => ({ ...prev, getPublicKey: result }));
            toast.success(`✅ Public key: ${result.publicKey.slice(0, 8)}...`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTestResults(prev => ({ ...prev, getPublicKey: { error: errorMessage } }));
            toast.error(`❌ getPublicKey failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testSignTransaction = async () => {
        setIsLoading(true);
        try {
            // Create a simple test transaction (this is just a mock base64 string)
            const mockTransaction = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMIA1sNQiQhNvTUqlyE98u1HWbt1SbqSuF0VlyriMKdcn1m9/rSwQNWbEk1YwZGzB7seFMqBpVBhllPAhpEBAAAAAA==';
            
            const result = await sendMessageToParent('signTransaction', {
                transaction: mockTransaction
            }) as { signature: string };
            setTestResults(prev => ({ ...prev, signTransaction: result }));
            toast.success(`✅ Transaction signed: ${result.signature.slice(0, 8)}...`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTestResults(prev => ({ ...prev, signTransaction: { error: errorMessage } }));
            toast.error(`❌ signTransaction failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testJupiterSwap = async () => {
        setIsLoading(true);
        try {
            // Mock Jupiter swap transaction (this would normally come from Jupiter API)
            const mockSwapTransaction = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMIA1sNQiQhNvTUqlyE98u1HWbt1SbqSuF0VlyriMKdcn1m9/rSwQNWbEk1YwZGzB7seFMqBpVBhllPAhpEBAAAAAA==';
            
            const result = await sendMessageToParent('jupiterSwap', {
                swapTransaction: mockSwapTransaction,
                userPublicKey: publicKey?.toString() || 'test-public-key'
            }) as { signature: string };
            setTestResults(prev => ({ ...prev, jupiterSwap: result }));
            toast.success(`✅ Swap completed: ${result.signature}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTestResults(prev => ({ ...prev, jupiterSwap: { error: errorMessage } }));
            toast.error(`❌ jupiterSwap failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testJupiterStake = async () => {
        setIsLoading(true);
        try {
            // Mock Jupiter stake transaction (this would normally come from Jupiter API)
            const mockStakeTransaction = 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMIA1sNQiQhNvTUqlyE98u1HWbt1SbqSuF0VlyriMKdcn1m9/rSwQNWbEk1YwZGzB7seFMqBpVBhllPAhpEBAAAAAA==';
            
            const result = await sendMessageToParent('jupiterStake', {
                transaction: mockStakeTransaction,
                userPublicKey: publicKey?.toString() || 'test-public-key'
            }) as { signature: string };
            setTestResults(prev => ({ ...prev, jupiterStake: result }));
            toast.success(`✅ Stake completed: ${result.signature}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTestResults(prev => ({ ...prev, jupiterStake: { error: errorMessage } }));
            toast.error(`❌ jupiterStake failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testReceiveSol = async () => {
        setIsLoading(true);
        try {
            // Test SOL transfer to a test address
            const testRecipient = '11111111111111111111111111111112'; // System Program ID as test recipient
            const testAmount = '1000000'; // 0.001 SOL in lamports
            
            const result = await sendMessageToParent('receiveSol', {
                amount: testAmount,
                to: testRecipient
            }) as { signature: string; amount: string; to: string };
            setTestResults(prev => ({ ...prev, receiveSol: result }));
            toast.success(`✅ SOL transfer completed: ${result.signature}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTestResults(prev => ({ ...prev, receiveSol: { error: errorMessage } }));
            toast.error(`❌ receiveSol failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testReceiveToken = async () => {
        setIsLoading(true);
        try {
            // Test token transfer to a test address
            const testMint = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
            const testRecipient = '11111111111111111111111111111112'; // System Program ID as test recipient
            const testAmount = '1000000'; // 0.001 wrapped SOL
            
            const result = await sendMessageToParent('receiveToken', {
                mint: testMint,
                amount: testAmount,
                to: testRecipient
            }) as { signature: string; mint: string; amount: string; to: string };
            setTestResults(prev => ({ ...prev, receiveToken: result }));
            toast.success(`✅ Token transfer completed: ${result.signature}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTestResults(prev => ({ ...prev, receiveToken: { error: errorMessage } }));
            toast.error(`❌ receiveToken failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testUnknownAction = async () => {
        setIsLoading(true);
        try {
            await sendMessageToParent('unknownAction', {});
            toast.error('❌ Should have failed with unknown action');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setTestResults(prev => ({ ...prev, unknownAction: { error: errorMessage } }));
            toast.success(`✅ Correctly rejected unknown action: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Parent Wallet Implementation Test
                    <Badge variant={connected ? "default" : "secondary"}>
                        {connected ? "Connected" : "Disconnected"}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Test all required parent wallet functions
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {connected ? (
                    <>
                        <div className="space-y-2">
                            <Label>Wallet</Label>
                            <p className="text-sm text-muted-foreground">
                                {wallet?.constructor.name || 'Unknown'} - {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rpc-endpoint">RPC Endpoint</Label>
                            <Input
                                id="rpc-endpoint"
                                value={rpcEndpoint}
                                onChange={(e) => setRpcEndpoint(e.target.value)}
                                placeholder="https://api.mainnet-beta.solana.com"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold">Required Functions Test</h3>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    onClick={testGetPublicKey}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    1. getPublicKey
                                </Button>
                                
                                <Button 
                                    onClick={testSignTransaction}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    2. signTransaction
                                </Button>
                                
                                <Button 
                                    onClick={testJupiterSwap}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    3. jupiterSwap
                                </Button>
                                
                                <Button 
                                    onClick={testJupiterStake}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    4. jupiterStake
                                </Button>

                                <Button 
                                    onClick={testReceiveSol}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    5. receiveSol
                                </Button>

                                <Button 
                                    onClick={testReceiveToken}
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    6. receiveToken
                                </Button>
                            </div>

                            <Button 
                                onClick={testUnknownAction}
                                disabled={isLoading}
                                variant="destructive"
                                size="sm"
                                className="w-full"
                            >
                                Test Error Handling (Unknown Action)
                            </Button>
                        </div>

                        {Object.keys(testResults).length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <h3 className="font-semibold">Test Results</h3>
                                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                                    {JSON.stringify(testResults, null, 2)}
                                </pre>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                            Connect a wallet to test parent wallet implementation
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 