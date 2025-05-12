import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EditorRedirect from '@/components/editor-redirect';

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
  const url = `https://alpha-gui.vercel.app/?project_url=${encodeURIComponent(
    project.url
  )}`;

  // Open editor in new tab
  return (
    <>
      <EditorRedirect url={url} />
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <p>Opening editor in a new tab...</p>
      </div>
    </>
  );
} 