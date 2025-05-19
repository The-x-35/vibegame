-- Add ca (contract address) column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ca text; 