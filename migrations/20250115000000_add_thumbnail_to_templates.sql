-- Add thumbnail column to templates table
ALTER TABLE templates ADD COLUMN IF NOT EXISTS thumbnail text;

-- Update existing templates to use default thumbnail if none provided
UPDATE templates SET thumbnail = '/og/og1.png' WHERE thumbnail IS NULL; 