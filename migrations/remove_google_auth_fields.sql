-- Remove Google Auth related fields from users table
ALTER TABLE users
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS profile_image_url; 