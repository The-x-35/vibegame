"use client";

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ALPHA_GUI } from '@/global/constant';
import { Suspense } from 'react';
import AttachTokenDialog from '@/components/launch-token-dialog';
import EditProjectDialog from '@/components/edit-project-dialog';
import DeleteProjectDialog from '@/components/delete-project-dialog';
import ShareProjectButton from '@/components/share-project-button';
import ClaimFeesDialog from '@/components/claim-fees-dialog';
import { useEffect, useState } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { getAuthHeader, removeAuthToken } from '@/lib/auth-utils';

interface ProjectRow {
  id: string;
  url: string;
  name: string;
  description: string;
  wallet: string;
  ca: string | null;
  is_public: boolean;
  thumbnail?: string; // Ensure thumbnail is optional and of type string
}

export default function ProjectPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading , refreshUser} = useUser();
  const router = useRouter();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const params = use(paramsPromise);

  // Callback to update project state from child components
  const updateProjectState = (updatedProject: { name?: string; description?: string; thumbnail?: string | null } | { ca: string; is_public: boolean }) => {
    if (project) {
      setProject({ ...project, ...updatedProject, thumbnail: 'thumbnail' in updatedProject ? updatedProject.thumbnail ?? project.thumbnail : project.thumbnail });
    }
  };

  useEffect(() => {
    if (isLoading) return; // wait until user is resolved
    if (!user) return; // no authenticated wallet – do nothing, loader continues

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        });
        
        if ((response.status === 401 || response.status === 403) && user) {
          if (response.status === 403) {
            removeAuthToken();
          }
          try {
            await refreshUser();
          } catch (err) {
            console.error('Auto login failed:', err);
          }
          const retryRes = await fetch(`/api/projects/${params.id}`, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader(),
            },
          });
          if (!retryRes.ok) {
            if (retryRes.status === 404 || retryRes.status === 403) {
              router.push('/not-found');
              return;
            }
            throw new Error('Failed to fetch project');
          }
          const retryData = await retryRes.json();
          const projectData = retryData.project;
          // Only owner can view this page
          if (!user || user.wallet !== projectData.wallet) {
            router.push('/not-found');
            return;
          }
          setProject(projectData);
          return;
        }
        
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            router.push('/not-found');
            return;
          }
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        const projectData = data.project;

        // Only owner can view this page
        if (!user || user.wallet !== projectData.wallet) {
          router.push('/not-found');
          return;
        }

        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [params.id, user, isLoading]);

  // Show loading state
  if (isLoading || isLoadingProject) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-video bg-muted rounded-lg"></div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show not found if project doesn't exist or user not authorized
  if (!project) {
    return notFound();
  }

  const embedUrl = `${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(
    project.url
  )}`;
  const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.id}`;

  return (
    <div className="min-h-screen container mx-auto px-4 py-10" style={{ backgroundImage: 'url(/bg.svg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }}>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/profile" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden shadow-sm border border-border/50">
            {/* Replace iframe with image element to display thumbnail */}
            <div className="relative aspect-video bg-muted overflow-hidden">
              <img
                src={project.thumbnail}
                alt={project.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300" />
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Created by:</span> {project.wallet}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Contract Address:</span> {project.ca || 'Not launched yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Status:</span> {project.ca ? 'Launched' : 'Draft'}
          </p>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-4">
              <AttachTokenDialog
                projectId={project.id}
                projectUrl={project.url}
                projectName={project.name}
                projectDescription={project.description}
                ca={project.ca}
                onUpdate={updateProjectState}
              />
              <Button size="lg" variant="outline" className="flex-1" asChild>
                <Link href={`/editor/${project.id}`}>Edit Game</Link>
              </Button>
            </div>
            <div className="flex gap-4">
              <EditProjectDialog
                projectId={project.id}
                projectName={project.name}
                projectDescription={project.description}
                onUpdate={updateProjectState}
              />
              <ShareProjectButton projectId={project.id} projectName={project.name} />
            </div>
            
            {/* Fee claiming section - only show if token is launched */}
            {project.ca && (
              <div className="pt-4 border-t">
                <ClaimFeesDialog 
                  tokenMint={project.ca}
                  tokenName={project.name}
                />
              </div>
            )}
            
            {/* <div className="pt-4 border-t">
              <DeleteProjectDialog 
                projectId={project.id} 
                onDelete={() => router.push('/profile')}
              />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}