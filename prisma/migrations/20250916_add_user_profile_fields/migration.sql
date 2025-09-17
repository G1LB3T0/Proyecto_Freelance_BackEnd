-- Migration: add user profile fields and user_social_links table

-- 1) Add new columns to user_details (nullable to avoid locking existing rows)
ALTER TABLE user_details
  ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500),
  ADD COLUMN IF NOT EXISTS website_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS location VARCHAR(150);

-- 2) Create user_social_links table
CREATE TABLE IF NOT EXISTS user_social_links (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user_details(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- 3) Add CHECK constraint for bio length (<= 1000)
ALTER TABLE user_details
  ADD CONSTRAINT chk_user_details_bio_length CHECK (char_length(bio) <= 1000);

-- 4) Ensure updated_at default (if not present) - safe guard
ALTER TABLE user_details
  ALTER COLUMN updated_at SET DEFAULT now();

-- End of migration
