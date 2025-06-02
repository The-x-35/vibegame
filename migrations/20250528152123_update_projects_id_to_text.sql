-- First drop the foreign key constraints
ALTER TABLE IF EXISTS comments DROP CONSTRAINT IF EXISTS comments_project_id_fkey;
ALTER TABLE IF EXISTS likes DROP CONSTRAINT IF EXISTS likes_project_id_fkey;

-- Then update the column types
ALTER TABLE comments ALTER COLUMN project_id TYPE text;
ALTER TABLE likes ALTER COLUMN project_id TYPE text;
ALTER TABLE projects ALTER COLUMN id TYPE text;

-- Update any existing UUIDs to be text slugs in all tables
UPDATE projects 
SET id = LOWER(REPLACE(id::text, '-', ''))
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE comments 
SET project_id = LOWER(REPLACE(project_id::text, '-', ''))
WHERE project_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE likes 
SET project_id = LOWER(REPLACE(project_id::text, '-', ''))
WHERE project_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Finally, re-add the foreign key constraints
ALTER TABLE comments ADD CONSTRAINT comments_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE likes ADD CONSTRAINT likes_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE; 