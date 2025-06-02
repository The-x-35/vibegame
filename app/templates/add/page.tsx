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
import { useUser } from "@/components/ui/use-user";
import { jwtDecode } from 'jwt-decode';

export default function AddTemplatePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const token = localStorage.getItem('appToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<{ sub: string }>(token);
      if (decoded.sub !== 'arpit.k3note@gmail.com') {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/login');
      return;
    }
  }, [user, isUserLoading, router]);

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
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('file', file);

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData,
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
      
      // Redirect to templates page
      router.push('/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
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