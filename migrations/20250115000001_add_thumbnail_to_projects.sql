-- Add thumbnail column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail text;

-- Update existing projects to use default thumbnail if none provided
UPDATE projects SET thumbnail = '/og/og1.png' WHERE thumbnail IS NULL; 