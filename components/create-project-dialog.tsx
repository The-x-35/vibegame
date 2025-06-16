"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Project } from "@/components/project-card";
import { Switch } from "@/components/ui/switch";
import { API_ENDPOINTS, ALPHA_GUI } from '@/global/constant';

interface LaunchProjectDialogProps {
  projectId: string;
  onLaunch: (ca: string) => void;
}

export default function CreateProjectDialog() {
  return (
    <Button size="lg" variant="default" type="button">
      Create Project
    </Button>
  );
}
