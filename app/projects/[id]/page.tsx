import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { ALPHA_GUI } from '@/global/constant';

interface ProjectRow {
  id: string;
  url: string;
  name: string;
  description: string;
  creator: string;
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const result = await query(
    `SELECT p.id, p.url, p.name, p.description, u.name AS creator
       FROM projects p
       JOIN users u ON p.wallet = u.wallet
       WHERE p.id = $1;`,
    [params.id]
  );

  if (result.rowCount === 0) {
    return notFound();
  }

  const project: ProjectRow = result.rows[0];
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

          <div className="flex gap-4 mt-4">
            <Button size="lg" className="flex-1">
              Launch Project
            </Button>
            <Button size="lg" variant="outline" className="flex-1" asChild>
              <Link href={`/editor/${project.id}`}>Edit Project</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}