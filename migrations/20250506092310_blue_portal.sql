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
  2. Security
    - Enable RLS on `games` table
    - Add policy for anyone to read game templates
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

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read game templates
CREATE POLICY "Anyone can read game templates"
  ON games
  FOR SELECT
  TO anon, authenticated
  USING (true);