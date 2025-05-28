-- Drop the existing foreign key constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_wallet_fkey;

-- Add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE projects ADD CONSTRAINT projects_wallet_fkey 
  FOREIGN KEY (wallet) REFERENCES users(wallet) ON DELETE CASCADE; 