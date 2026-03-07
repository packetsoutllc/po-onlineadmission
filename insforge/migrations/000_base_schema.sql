-- Base schema for po-onlineadmission (InsForge).
-- Run this first, then 001_verify_placement.sql, then 002_applicant_validate_credentials.sql.
-- Tables referenced by RPCs and edge functions: schools, admissions, students, credentials, payment_status.

-- Schools (public listing)
CREATE TABLE IF NOT EXISTS schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  status TEXT DEFAULT 'active',
  home_region TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_anon_select" ON schools FOR SELECT TO anon USING (true);
CREATE POLICY "schools_authenticated_all" ON schools FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admissions (per school)
CREATE TABLE IF NOT EXISTS admissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  portal_status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, slug)
);

ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admissions_anon_select" ON admissions FOR SELECT TO anon USING (true);
CREATE POLICY "admissions_authenticated_all" ON admissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Students (placed/admitted) — used by verify_placement RPC
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  index_number TEXT NOT NULL,
  name TEXT,
  programme TEXT,
  gender TEXT,
  residence TEXT,
  aggregate TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id, index_number)
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_authenticated_all" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Credentials (serial + PIN for applicant login) — used by applicant_validate_credentials RPC
CREATE TABLE IF NOT EXISTS credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  index_number TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id, serial_number)
);

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credentials_authenticated_all" ON credentials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payment status (initial / doc_access) — used by payment-callback edge function
CREATE TABLE IF NOT EXISTS payment_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  index_number TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'initial',
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id, index_number, payment_type)
);

ALTER TABLE payment_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_status_authenticated_all" ON payment_status FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes for RPCs and lookups
CREATE INDEX IF NOT EXISTS idx_students_school_admission_index ON students(school_id, admission_id, index_number);
CREATE INDEX IF NOT EXISTS idx_credentials_school_admission_serial ON credentials(school_id, admission_id, serial_number);
