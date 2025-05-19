import { notFound } from 'next/navigation';
import SuggestionCard from '@/components/suggestion-card';
import { query } from '@/lib/db';
import { ALPHA_GUI } from '@/global/constant';

interface ProjectRow {
  id: string;
  url: string;
  name: string;
  description: string;
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await query(
    `SELECT id, url, name, description FROM projects WHERE id = $1`,
    [id]
  );

  if (result.rowCount === 0) {
    return notFound();
  }

  const project: ProjectRow = result.rows[0];
  const embedUrl = `${ALPHA_GUI.BASE_URL}/?project_url=${encodeURIComponent(project.url)}`;

  return (
    <div className="container mx-auto py-8">
      <SuggestionCard
        embedUrl={embedUrl}
        name={project.name}
        description={project.description}
        heightClass="h-[90vh]"
      />
    </div>
  );
}