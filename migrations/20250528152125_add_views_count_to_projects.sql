-- Add views_count column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Update existing rows to have 0 views
UPDATE projects SET views_count = 0 WHERE views_count IS NULL;

-- Create index for faster queries on views_count
CREATE INDEX IF NOT EXISTS idx_projects_views_count ON projects(views_count); 