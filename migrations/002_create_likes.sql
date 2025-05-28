-- 002_create_likes.sql

-- Create likes table with proper column name (project_id instead of game_id)
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    wallet TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, wallet)
);

-- Add likes_count column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_likes_project_id ON likes(project_id);
CREATE INDEX IF NOT EXISTS idx_likes_wallet ON likes(wallet);

-- Update existing rows to have 0 likes
UPDATE projects SET likes_count = 0 WHERE likes_count IS NULL; 