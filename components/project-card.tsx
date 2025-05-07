"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Lock, Edit, Eye } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export interface Project {
  id: string;
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
}

export function ProjectCard({ project, onToggleVisibility }: ProjectCardProps) {
  const handleToggleVisibility = () => {
    if (onToggleVisibility) {
      onToggleVisibility(project.id, !project.isPublic);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border border-border/50">
      <div className="relative aspect-video bg-muted">
        {project.thumbnail ? (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${project.thumbnail})` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/30 to-primary/10">
            <span className="text-xl font-bold text-foreground/30">{project.name.substring(0, 2).toUpperCase()}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          {project.isPublic ? (
            <div className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              Public
            </div>
          ) : (
            <div className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded-full flex items-center">
              <Lock className="w-3 h-3 mr-1" />
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
        <Button size="sm" variant="outline" asChild>
          <Link href={`/editor/${project.id}`}>
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Link>
        </Button>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleToggleVisibility}
          >
            {project.isPublic ? (
              <>
                <Lock className="w-4 h-4 mr-1" />
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
            <Button size="sm" variant="outline" asChild>
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