/*
  # Create games table for templates

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `url` (text, not null)
      - `thumbnail` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
*/

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  url text NOT NULL,
  thumbnail text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Grant necessary permissions to app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON games TO app_user;