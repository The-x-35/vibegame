-- Create token_launches table
CREATE TABLE IF NOT EXISTS token_launches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_address text NOT NULL UNIQUE,
    token_name text NOT NULL,
    token_ticker text NOT NULL,
    description text,
    website text,
    twitter text,
    telegram text,
    image_url text NOT NULL,
    is_launched boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_token_launches_token_address ON token_launches(token_address);
CREATE INDEX IF NOT EXISTS idx_token_launches_token_ticker ON token_launches(token_ticker);

-- Grant necessary permissions to app_user
GRANT SELECT, INSERT, UPDATE ON token_launches TO app_user; 