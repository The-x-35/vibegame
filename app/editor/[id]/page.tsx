"use client";

import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { ALPHA_GUI } from '@/global/constant';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import SuggestionCard from '@/components/suggestion-card';
import { S3IframeHandler } from '@/components/s3-iframe-handler';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { use } from 'react';
import { getAuthHeader, loginWithWallet, removeAuthToken } from '@/lib/auth-utils';

interface ProjectRow {
  id: string;
  url: string;
  name: string;
  description: string;
  wallet: string;
  is_public: boolean;
}

export default function EditorPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const params = use(paramsPromise);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (isLoading) return;
        if (!user) return;

        const response = await fetch(`/api/projects/${params.id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        });

        if ((response.status === 401 || response.status === 403) && user) {
          // Try to login to get a new token and retry
          try {
            if (response.status === 403) {
              removeAuthToken();
            }
            await loginWithWallet(user.wallet);
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
            if (retryRes.status === 404) {
              router.push('/not-found');
              return;
            }
            throw new Error('Failed to fetch project');
          }
          const retryData = await retryRes.json();
          const projectData = retryData.project;
          if (user.wallet !== projectData.wallet) {
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

        // Only owner can open editor
        if (user.wallet !== projectData.wallet) {
          router.push('/not-found');
          return;
        }

        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project:', error);
        router.push('/');
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProject();
  }, [params.id, user, isLoading, router]);

  // Show loading state
  if (isLoading || isLoadingProject) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show nothing if not authorized
  if (!project || !user) {
    return null;
  }

  const embedUrl = `${ALPHA_GUI.BASE_URL}/?project_url=${encodeURIComponent(project.url)}`;

  return (
    <div className="container mx-auto py-8">
      <S3IframeHandler currentProjectUrl={project.url} />
      
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link href={`/projects/${project.id}`}>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy Project
          </Link>
        </Button>
      </div>
      <SuggestionCard
        embedUrl={embedUrl}
        name={project.name}
        description={project.description}
        heightClass="h-[90vh]"
        showIframe={true}
      />
    </div>
  );
}