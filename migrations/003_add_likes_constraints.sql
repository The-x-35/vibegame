-- 003_add_likes_constraints.sql

-- Add constraint to prevent negative likes count
ALTER TABLE projects ADD CONSTRAINT projects_likes_count_non_negative CHECK (likes_count >= 0);

-- Add constraint to prevent negative views count
ALTER TABLE projects ADD CONSTRAINT projects_views_count_non_negative CHECK (views_count >= 0);

-- Add constraint to prevent negative comments count
ALTER TABLE projects ADD CONSTRAINT projects_comments_count_non_negative CHECK (comments_count >= 0);

-- Update any existing negative values to 0
UPDATE projects SET likes_count = 0 WHERE likes_count < 0;
UPDATE projects SET views_count = 0 WHERE views_count < 0;
UPDATE projects SET comments_count = 0 WHERE comments_count < 0;

-- Add index for better performance on likes queries
CREATE INDEX IF NOT EXISTS idx_likes_project_wallet ON likes(project_id, wallet);

-- Add index for better performance on comments queries
CREATE INDEX IF NOT EXISTS idx_comments_project_created ON comments(project_id, created_at DESC);

-- Add unique constraint to prevent duplicate likes from same wallet on same project
-- (This should already exist from the previous migration, but adding it here for safety)
ALTER TABLE likes ADD CONSTRAINT likes_project_wallet_unique UNIQUE (project_id, wallet);

-- Grant necessary permissions to app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON likes TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON comments TO app_user; 