import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/use-user";
import { jwtDecode } from 'jwt-decode';
import { useEffect } from "react";

interface DeleteTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
}

export default function DeleteTemplateDialog({
  isOpen,
  onClose,
  templateId,
  templateName,
}: DeleteTemplateDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;
    
    if (!user || !user.wallet) {
      router.push('/');
      return;
    }

    // Check if the connected wallet matches the allowed address
    if (user.wallet !== 'AidmVBuszvzCJ6cWrBQfKNwgNPU4KCvXBcrWh91vitm8') {
      router.push('/');
      return;
    }
  }, [user, isUserLoading, router]);

  const handleDelete = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  // Don't render anything if not authorized
  if (!user || isUserLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{templateName}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 