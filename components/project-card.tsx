"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock as LockIcon, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { ALPHA_GUI } from '@/global/constant';

export interface Project {
  id: string;
  url: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}

interface ProjectCardProps {
  project: Project;
  onToggleVisibility?: (id: string, isPublic: boolean) => void;
  onClick?: () => void;
}

export function ProjectCard({ project, onToggleVisibility, onClick }: ProjectCardProps) {

  // Preview embed URL
  const embedUrl = `${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(
    project.url
  )}`;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group overflow-hidden hover:shadow-md transition-all duration-200 border border-border/50",
        onClick && "cursor-pointer"
      )}
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        <iframe
          src={embedUrl}
          title={project.name}
          className="w-full h-full"
          frameBorder="0"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300" />
        <div className="absolute top-2 right-2">
          {project.isPublic ? (
            <div className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              Launched
            </div>
          ) : (
            <div className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded-full flex items-center">
              <LockIcon className="w-3 h-3 mr-1" />
              Draft
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
            <p className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(project.updatedAt)} ago
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
      </CardContent>


    </Card>
  );
}