'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { loginWithWallet, getAuthToken } from '@/lib/auth-utils';
import { uploadProjectFile } from '@/lib/utils/chunked-upload';

interface S3IframeHandlerProps {
    currentProjectUrl?: string;
}

export function S3IframeHandler({ currentProjectUrl }: S3IframeHandlerProps) {
    const { publicKey, connected } = useWallet();

    // Auto-login when wallet connects (just like other pages)
    useEffect(() => {
        const handleWalletLogin = async () => {
            if (connected && publicKey && !getAuthToken()) {
                try {
                    await loginWithWallet(publicKey.toString());
                    console.log('🔐 Auto-login successful in editor');
                } catch (error) {
                    console.error('❌ Auto-login failed in editor:', error);
                }
            }
        };

        handleWalletLogin();
    }, [connected, publicKey]);

    useEffect(() => {
        const handleS3Message = async (event: MessageEvent) => {
            const { data, source } = event;
            
            // Only handle alpha-iframe messages for S3 file operations
            if (!data || data.source !== 'alpha-iframe') return;

            const { action, payload, requestId } = data;

            console.log('💾 S3 Handler received message from iframe:');
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

            // Only handle S3 file saving actions
            if (action !== 'saveSb3File') return;

            try {
                if (!connected || !publicKey) {
                    throw new Error('No wallet connected. Please connect your wallet to save files.');
                }

                const { fileData, filename } = payload;
                
                if (!fileData) {
                    throw new Error('Missing file data');
                }

                if (!currentProjectUrl) {
                    throw new Error('No current project URL available');
                }

                console.log('🎯 Saving SB3 file to S3');
                console.log('📁 File size:', fileData.length, 'bytes');
                console.log('🔗 Current project URL:', currentProjectUrl);

                // Extract the current file ID from the project URL
                let currentFileId: string;
                try {
                    const url = new URL(currentProjectUrl);
                    // Extract the S3 key from the URL path
                    currentFileId = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
                } catch (urlError) {
                    console.error('Invalid project URL:', urlError);
                    throw new Error('Invalid project URL format');
                }

                console.log('📋 Extracted file ID:', currentFileId);

                // Get JWT token using the utility function (same as other components)
                let token = getAuthToken();
                console.log('🔍 Token from getAuthToken():', token ? `${token.substring(0, 20)}...` : 'null');

                // If no token, try to auto-login
                if (!token) {
                    console.log('🔑 No token found, attempting auto-login...');
                    try {
                        await loginWithWallet(publicKey.toString());
                        console.log('🔐 Auto-login successful during save');
                        
                        // Try to get token again after login
                        token = getAuthToken();
                        console.log('🔍 Token after auto-login:', token ? `${token.substring(0, 20)}...` : 'still null');
                    } catch (loginError) {
                        console.error('❌ Auto-login failed during save:', loginError);
                        throw new Error('Authentication failed. Please refresh the page and reconnect your wallet.');
                    }
                }

                if (!token) {
                    throw new Error('No valid authentication token found. Please refresh the page and reconnect your wallet.');
                }

                // Debug: Try to decode the token to see what's in it
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        console.log('🔍 Token payload:', payload);
                        console.log('🔍 Token wallet:', payload.wallet);
                        console.log('🔍 Token userId:', payload.userId, typeof payload.userId);
                        console.log('🔍 Current wallet:', publicKey.toString());
                    }
                } catch (decodeError) {
                    console.warn('Could not decode token for debugging:', decodeError);
                }

                // Prepare headers (same as other components)
                console.log('📤 Starting chunked upload with token:', token ? 'present' : 'missing');

                // Use chunked upload instead of direct upload
                const uploadResult = await uploadProjectFile(
                    fileData,
                    filename || 'project.sb3',
                    publicKey.toString(),
                    currentFileId,
                    token!,
                    (progress) => {
                        console.log(`📊 Upload progress: ${Math.round(progress * 100)}%`);
                    }
                );

                console.log('✅ Chunked upload successful, S3 Key:', uploadResult.key);
                console.log('🔗 File URL:', uploadResult.url);

                const { success, key, url } = uploadResult;

                console.log('✅ Successfully saved SB3 file to S3');
                const result = { 
                    success: true, 
                    message: 'File saved successfully',
                    fileKey: key,
                    timestamp: new Date().toISOString()
                };

                reply(result);
                
                // Clear browser caches and storage before reloading
                console.log('🧹 Clearing browser caches and storage...');
                
                // Clear various browser caches
                try {
                    // Clear localStorage entries related to the project
                    const projectUrlKey = currentProjectUrl.split('/').pop(); // Get filename
                    if (projectUrlKey) {
                        for (let i = localStorage.length - 1; i >= 0; i--) {
                            const key = localStorage.key(i);
                            if (key && key.includes(projectUrlKey)) {
                                console.log('🗑️ Removing localStorage:', key);
                                localStorage.removeItem(key);
                            }
                        }
                    }
                    
                    // Clear sessionStorage entries
                    for (let i = sessionStorage.length - 1; i >= 0; i--) {
                        const key = sessionStorage.key(i);
                        if (key && projectUrlKey && key.includes(projectUrlKey)) {
                            console.log('🗑️ Removing sessionStorage:', key);
                            sessionStorage.removeItem(key);
                        }
                    }
                    
                    // Try to clear cache storage if available
                    if ('caches' in window) {
                        caches.keys().then(cacheNames => {
                            cacheNames.forEach(cacheName => {
                                console.log('🗑️ Clearing cache:', cacheName);
                                caches.delete(cacheName);
                            });
                        });
                    }
                    
                } catch (e) {
                    console.log('Could not clear some caches:', e);
                }
                
                // Simple approach: just reload the iframe without changing any URLs
                setTimeout(() => {
                    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                        console.log('🔄 Reloading iframe content (same URL)');
                        try {
                            iframe.contentWindow.location.reload();
                        } catch (e) {
                            console.log('Could not reload iframe content, trying iframe src reload');
                            // Fallback: just reassign the same src to force reload
                            const currentSrc = iframe.src;
                            iframe.src = '';
                            setTimeout(() => {
                                iframe.src = currentSrc; // Exact same URL
                            }, 100);
                        }
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ Error saving SB3 file:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                reply(null, errorMessage);
            }
        };

        window.addEventListener('message', handleS3Message);
        return () => window.removeEventListener('message', handleS3Message);
    }, [publicKey, connected, currentProjectUrl]);

    return null; // This component doesn't render anything
} 