"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Lock as LockIcon, Edit, Eye } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
  const handleToggle = () => {
    onToggleVisibility?.(project.id, !project.isPublic);
  };

  // Preview embed URL
  const embedUrl = `https://alpha-gui.vercel.app/embed.html?autoplay&project_url=${encodeURIComponent(
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
              Public
            </div>
          ) : (
            <div className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded-full flex items-center">
              <LockIcon className="w-3 h-3 mr-1" />
              Private
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

      <CardFooter className="flex justify-between border-t pt-3 mt-2">
        <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
          <Link href={`/editor/${project.id}`}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
            {project.isPublic ? (
              <>
                <LockIcon className="w-4 h-4 mr-1" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Make Public
              </>
            )}
          </Button>

          {project.isPublic && (
            <Button size="sm" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/projects/${project.id}`}>
                <Share2 className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}