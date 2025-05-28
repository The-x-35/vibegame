/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users.id)
      - `name` (text, not null)
      - `description` (text)
      - `is_public` (boolean, default false)
      - `thumbnail` (text)
      - `source_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  thumbnail text,
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Grant necessary permissions to app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO app_user;