-- Create v2_games table for AI-generated web games
CREATE TABLE IF NOT EXISTS v2_games (
  id TEXT PRIMARY KEY, -- slug/id for the game
  wallet TEXT NOT NULL, -- owner wallet
  name TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  s3_prefix TEXT NOT NULL, -- S3 folder prefix where files are stored (e.g., wallet/v2/<id>/)
  index_key TEXT NOT NULL, -- S3 key to the entry file (e.g., wallet/v2/<id>/index.html)
  files JSONB DEFAULT '[]'::jsonb NOT NULL, -- array of {path,key,url}
  is_public BOOLEAN DEFAULT FALSE NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS v2_games_wallet_idx ON v2_games(wallet);
CREATE INDEX IF NOT EXISTS v2_games_is_public_idx ON v2_games(is_public);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_v2_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_v2_games_updated_at ON v2_games;
CREATE TRIGGER trg_update_v2_games_updated_at
BEFORE UPDATE ON v2_games
FOR EACH ROW EXECUTE PROCEDURE update_v2_games_updated_at();


