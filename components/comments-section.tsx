'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  wallet: string;
  name: string | null;
  profile_image: string | null;
}

interface CommentsSectionProps {
  projectId: string;
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

    const appToken = localStorage.getItem('appToken');
    if (!appToken) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/games/${projectId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appToken}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();
      setComments(prev => [data, ...prev]);
      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment posted successfully',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string | null, wallet: string) => {
    if (name) return name.substring(0, 2).toUpperCase();
    return wallet.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'recently';
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
        />
        <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 p-4 rounded-lg border">
            <Avatar>
              <AvatarImage src={comment.profile_image || undefined} />
              <AvatarFallback>{getInitials(comment.name, comment.wallet)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.name || comment.wallet}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 