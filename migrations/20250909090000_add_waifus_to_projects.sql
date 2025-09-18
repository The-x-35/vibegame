-- Add waifu support by extending projects table

-- Project type: 'game' (default) or 'waifu'
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'game';

-- Waifu-specific fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS glb_url TEXT; -- S3 URL of .glb avatar
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rpm_avatar_id TEXT; -- ReadyPlayerMe avatar id
ALTER TABLE projects ADD COLUMN IF NOT EXISTS system_prompt TEXT; -- Chat system prompt

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);

-- Backfill null type to 'game'
UPDATE projects SET type = 'game' WHERE type IS NULL;

