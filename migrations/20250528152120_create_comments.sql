-- Add your SQL migration here

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    wallet TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments_count column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_wallet ON comments(wallet);

-- Update existing rows to have 0 comments
UPDATE projects SET comments_count = 0 WHERE comments_count IS NULL;
