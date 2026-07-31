-- Run this once in Supabase SQL Editor to create the scraped vegetables table
-- Dashboard: https://supabase.com/dashboard/project/iqqwluznjbbeosfkctsa/sql

CREATE TABLE IF NOT EXISTS scraped_vegetables (
  id          BIGSERIAL PRIMARY KEY,
  product     TEXT NOT NULL UNIQUE,   -- UNIQUE enables upsert by product name
  price       TEXT,
  weight      TEXT,
  image_url   TEXT,
  scraped_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: index for fast lookups by product name
CREATE INDEX IF NOT EXISTS idx_scraped_vegetables_product ON scraped_vegetables(product);
