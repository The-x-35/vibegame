"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from '@solana/wallet-adapter-react';
import { uploadThumbnailFile } from "@/lib/utils/chunked-upload";

interface EditProjectDialogProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectCa: string | null;
  onUpdate?: (updatedProject: { name?: string; description?: string; ca?: string | null; thumbnail?: string | null }) => void;
}

export default function EditProjectDialog({ 
  projectId, 
  projectName, 
  projectDescription,
  projectCa,
  onUpdate,
}: EditProjectDialogProps) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectDescription);
  const [ca, setCa] = useState(projectCa || "");
  const [isLoading, setIsLoading] = useState(false);
  // Add state for thumbnail
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(projectName);
      setDescription(projectDescription);
      setCa(projectCa || "");
    }
  }, [isOpen, projectName, projectDescription, projectCa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Updating project details...');
      
      if (!publicKey) {
        throw new Error('Please connect your wallet');
      }

      // Handle thumbnail upload using chunked upload
      let thumbnailUrl = null;
      if (thumbnail) {
        console.log('🖼️ Starting thumbnail upload with chunked upload...');
        const uploadResult = await uploadThumbnailFile(
          thumbnail,
          (progress) => {
            console.log(`📊 Thumbnail upload progress: ${Math.round(progress * 100)}%`);
          }
        );
        thumbnailUrl = uploadResult.url;
        console.log('✅ Thumbnail uploaded successfully:', thumbnailUrl);
      }

      console.log('Request body:', {
        name: name.trim(),
        description: description.trim(),
        ca: ca.trim() || null,
        wallet: publicKey.toString(),
        thumbnail: thumbnailUrl,
      });

      const updateResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          ca: ca.trim() || null,
          wallet: publicKey.toString(),
          thumbnail: thumbnailUrl, // Include thumbnail URL
        }),
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Failed to update project:', errorData);
        throw new Error('Failed to update project details');
      }
      
      const responseData = await updateResponse.json();
      console.log('Project updated successfully');
      setIsOpen(false);
      
      // If the project ID has changed (due to name change), redirect to the new URL
      if (responseData.project.id !== projectId) {
        router.push(`/projects/${responseData.project.id}`);
      } else {
        // Update parent state instead of refreshing
        if (onUpdate) {
          onUpdate({
            name: name.trim(),
            description: description.trim(),
            ca: ca.trim() || null,
            thumbnail: thumbnailUrl, // Update parent with new thumbnail
          });
        }
      }
    } catch (err) {
      console.error('Project update error:', err);
      alert(`Project update failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto bg-black/40 backdrop-blur-xl border border-gray-800/50">
        <DialogHeader>
          <DialogTitle>Edit Project Details</DialogTitle>
          <DialogDescription>Update your project information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-name" className="text-right">Name</Label>
            <Input 
              id="project-name" 
              className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700" 
              placeholder="Project Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="project-description" className="text-right pt-2">Description</Label>
            <Textarea 
              id="project-description" 
              className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700" 
              placeholder="Project Description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-ca" className="text-right">Contract Address</Label>
            <Input 
              id="project-ca" 
              className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700" 
              placeholder="Enter contract address (optional)"
              value={ca}
              onChange={(e) => setCa(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project-thumbnail" className="text-right">Thumbnail</Label>
            <Input 
              id="project-thumbnail" 
              type="file"
              accept="image/*"
              className="col-span-3 bg-black border-gray-800 text-white placeholder:text-gray-500 focus:ring-0 focus:border-gray-700" 
              onChange={(e) => setThumbnail(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 