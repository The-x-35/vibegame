-- Add name and description columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;

-- Update existing rows to have default values
UPDATE projects SET name = 'Untitled Project' WHERE name IS NULL;
UPDATE projects SET description = '' WHERE description IS NULL;

-- Make name column not null after setting default values
ALTER TABLE projects ALTER COLUMN name SET NOT NULL; 