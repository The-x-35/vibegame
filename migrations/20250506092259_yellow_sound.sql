/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `auth_id` (text, unique, for Privy integration)
      - `email` (text)
      - `name` (text)
      - `profile_image` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id text UNIQUE NOT NULL,
  email text,
  name text,
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create a role for application users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user;
  END IF;
END
$$;

-- Grant necessary permissions to app_user
GRANT SELECT, INSERT, UPDATE ON users TO app_user;