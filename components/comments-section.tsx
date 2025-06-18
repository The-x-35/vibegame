'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { getAuthToken, loginWithWallet } from '@/lib/auth-utils';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  wallet: string;
}

interface CommentsSectionProps {
  projectId: string;
  onCommentAdded?: () => void;
}

export function CommentsSection({ projectId, onCommentAdded }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  // Auto-login when wallet connects
  useEffect(() => {
    const handleWalletLogin = async () => {
      if (connected && publicKey && !getAuthToken()) {
        try {
          await loginWithWallet(publicKey.toString());
          console.log('Auto-login successful in comments');
        } catch (error) {
          console.error('Auto-login failed in comments:', error);
        }
      }
    };

    handleWalletLogin();
  }, [connected, publicKey]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/games/${projectId}/comment`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Get JWT token using the utility function
      const token = getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add JWT token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/games/${projectId}/comment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          content: newComment,
          wallet: publicKey.toString()
        })
      });

      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.error?.includes('connect your wallet')) {
          toast({
            title: "Wallet Required",
            description: "Please connect your wallet to post comments",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Authentication failed",
            description: "Please connect your wallet again",
            variant: "destructive",
          });
        }
        return;
      }

      if (response.status === 429) {
        const data = await response.json();
        toast({
          title: "Rate limit exceeded",
          description: `Please wait ${data.retryAfter} seconds before posting again`,
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const data = await response.json();
      setComments(prev => [data, ...prev]);
      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment posted successfully',
      });
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (wallet: string) => {
    return wallet.substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = (wallet: string) => {
    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${wallet}`;
  };

  const shortenWallet = (wallet: string) => {
    if (!wallet) return '';
    if (wallet.length <= 7) return wallet; // already short enough
    return `${wallet.slice(0, 4)}...${wallet.slice(-3)}`;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'recently';
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'recently';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Comments list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 p-4 rounded-lg border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarUrl(comment.wallet)} alt={comment.wallet} className="h-8 w-8" />
              <AvatarFallback className="text-xs">{getInitials(comment.wallet)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              {/* Name and timestamp */}
              <div className="flex flex-col">
                <span className="font-medium leading-tight">{shortenWallet(comment.wallet)}</span>
                <span className="text-xs text-muted-foreground leading-tight">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              {/* Comment text */}
              <p className="text-sm break-words whitespace-pre-line">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input form at bottom */}
      <div className="mt-4 pt-4 border-t">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Send it to the..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button 
            type="submit" 
            className='w-full bg-[#3405EE] hover:bg-[#2804cc] text-white' 
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </form>
      </div>
    </div>
  );
} 