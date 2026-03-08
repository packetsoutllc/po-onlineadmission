-- 008: Add created_at / updated_at to schools if missing (e.g. table created without full base schema).
-- Run: npx insforge db import insforge/migrations/008_schools_created_at.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'created_at') THEN
    ALTER TABLE schools ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'updated_at') THEN
    ALTER TABLE schools ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;
