/*
  # Migration: Add wallet column to users table
*/

ALTER TABLE IF EXISTS users
  ADD COLUMN wallet text NOT NULL UNIQUE;

-- Note: If you want to make wallet the primary key and remove `id`, you can drop the existing primary key and `id` column, then add a new primary key on `wallet`:
-- ALTER TABLE users DROP CONSTRAINT users_pkey;
-- ALTER TABLE users DROP COLUMN id;
-- ALTER TABLE users ADD PRIMARY KEY (wallet); 