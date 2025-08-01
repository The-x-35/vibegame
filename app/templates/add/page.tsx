"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/lib/hooks/use-user";
import { jwtDecode } from 'jwt-decode';
import { uploadTemplateFile, uploadThumbnailFile } from "@/lib/utils/chunked-upload";

export default function AddTemplatePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
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

  // Cleanup thumbnail preview URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  // Show loading state while checking user authentication
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not authorized (redirect will happen in useEffect)
  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.sb3')) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a .sb3 file",
        variant: "destructive",
      });
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's an image file
      if (selectedFile.type.startsWith('image/')) {
        setThumbnail(selectedFile);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(selectedFile);
        setThumbnailPreview(previewUrl);
      } else {
        toast({
          title: "Invalid file",
          description: "Please select an image file (PNG, JPG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const clearThumbnail = () => {
    setThumbnail(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !file) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload template file using chunked upload
      console.log('🚀 Starting template upload with chunked upload...');
      const uploadResult = await uploadTemplateFile(
        file,
        name,
        (progress) => {
          console.log(`📊 Template upload progress: ${Math.round(progress * 100)}%`);
        }
      );

      console.log('✅ Template file uploaded successfully:', uploadResult.url);

      // Upload thumbnail if provided
      let thumbnailUrl = '/og/og1.png'; // Default thumbnail
      if (thumbnail) {
        console.log('🖼️ Starting thumbnail upload...');
        const thumbnailResult = await uploadThumbnailFile(
          thumbnail,
          (progress) => {
            console.log(`📊 Thumbnail upload progress: ${Math.round(progress * 100)}%`);
          }
        );
        thumbnailUrl = thumbnailResult.url;
        console.log('✅ Thumbnail uploaded successfully:', thumbnailUrl);
      }

      // Create template record in database
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          url: uploadResult.url,
          thumbnail: thumbnailUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      toast({
        title: "Success",
        description: "Template created successfully",
      });

      // Reset form
      setName("");
      setDescription("");
      setFile(null);
      setThumbnail(null);
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
        setThumbnailPreview(null);
      }
      
      // Redirect to templates page
      router.push('/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast({
            title: "Upload Timeout",
            description: "The upload took too long. Please try again with a smaller file or check your internet connection.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to create template",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Add New Template
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Upload a new game template to share with the community.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter template name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your template"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Template File (.sb3)</Label>
              <Input
                id="file"
                type="file"
                accept=".sb3"
                onChange={handleFileChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Only .sb3 files are accepted
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
              <p className="text-sm text-muted-foreground">
                Upload a thumbnail image for your template. If not provided, a default image will be used.
              </p>
              
              {thumbnailPreview && (
                <div className="mt-4 space-y-2">
                  <Label>Preview:</Label>
                  <div className="relative inline-block">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={clearThumbnail}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Template"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 