-- Change templates.id from UUID to TEXT
ALTER TABLE templates ALTER COLUMN id TYPE text;

-- Update any existing UUIDs to be text slugs
UPDATE templates 
SET id = LOWER(REPLACE(id::text, '-', ''))
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; 