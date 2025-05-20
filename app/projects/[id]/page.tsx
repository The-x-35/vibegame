import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { ALPHA_GUI } from '@/global/constant';
import { Suspense } from 'react';
import LaunchTokenDialog from '@/components/launch-token-dialog';
import DeleteProjectDialog from '@/components/delete-project-dialog';

interface ProjectRow {
  id: string;
  url: string;
  name: string;
  description: string;
  creator: string;
  ca: string | null;
  is_public: boolean;
}

async function getProjectData(projectId: string) {
  try {
    const result = await query(
      `SELECT p.id, p.url, p.name, p.description, p.ca, p.is_public, u.name AS creator
       FROM projects p
       JOIN users u ON p.wallet = u.wallet
       WHERE p.id = $1;`,
      [projectId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0] as ProjectRow;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new Error('Failed to fetch project data');
  }
}

function ProjectContent({ project }: { project: ProjectRow }) {
  const embedUrl = `${ALPHA_GUI.EMBED_URL}?project_url=${encodeURIComponent(
    project.url
  )}`;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden shadow-sm border border-border/50">
            <div className="relative aspect-video bg-muted overflow-hidden">
              <iframe
                src={embedUrl}
                title={project.name}
                className="w-full h-full"
                frameBorder="0"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Created by:</span> {project.creator}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Contract Address:</span> {project.ca || 'Not launched yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Status:</span> {project.is_public ? 'Public' : 'Private'}
          </p>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-4">
              <LaunchTokenDialog
                projectId={project.id}
                projectUrl={project.url}
                projectName={project.name}
                projectDescription={project.description}
                ca={project.ca}
              />
              <Button size="lg" variant="outline" className="flex-1" asChild>
                <Link href={`/editor/${project.id}`}>Edit Project</Link>
              </Button>
            </div>
            <DeleteProjectDialog projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { id: projectId } = await Promise.resolve(params);
  const project = await getProjectData(projectId);

  if (!project) {
    return notFound();
  }

  return (
    <Suspense fallback={
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
    }>
      <ProjectContent project={project} />
    </Suspense>
  );
}