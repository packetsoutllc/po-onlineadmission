-- 003: Add columns to admissions/students; add submission_status, application_data, settings tables.
-- Run after 000, 001, 002. Allows anon full access on new tables so app works without InsForge Auth (demo).

-- Admissions: add columns expected by app and verify
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'description') THEN
    ALTER TABLE admissions ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'date') THEN
    ALTER TABLE admissions ADD COLUMN date TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'auth_method') THEN
    ALTER TABLE admissions ADD COLUMN auth_method TEXT DEFAULT 'Index number only';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'status') THEN
    ALTER TABLE admissions ADD COLUMN status TEXT DEFAULT 'Active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'applicants_placed') THEN
    ALTER TABLE admissions ADD COLUMN applicants_placed INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'students_admitted') THEN
    ALTER TABLE admissions ADD COLUMN students_admitted INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'index_hint') THEN
    ALTER TABLE admissions ADD COLUMN index_hint TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'head_of_school_number') THEN
    ALTER TABLE admissions ADD COLUMN head_of_school_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admissions' AND column_name = 'head_of_it_number') THEN
    ALTER TABLE admissions ADD COLUMN head_of_it_number TEXT;
  END IF;
END $$;

-- Students: add columns used by verify_placement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'status') THEN
    ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'Placed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'fee_status') THEN
    ALTER TABLE students ADD COLUMN fee_status TEXT DEFAULT 'Unpaid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'is_protocol') THEN
    ALTER TABLE students ADD COLUMN is_protocol BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'phone_number') THEN
    ALTER TABLE students ADD COLUMN phone_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'class_id') THEN
    ALTER TABLE students ADD COLUMN class_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'house_id') THEN
    ALTER TABLE students ADD COLUMN house_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'dormitory_id') THEN
    ALTER TABLE students ADD COLUMN dormitory_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'admission_date') THEN
    ALTER TABLE students ADD COLUMN admission_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'payment_date') THEN
    ALTER TABLE students ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;
END $$;

-- submission_status
CREATE TABLE IF NOT EXISTS submission_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  index_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id, index_number)
);
ALTER TABLE submission_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submission_status_authenticated_all" ON submission_status;
CREATE POLICY "submission_status_authenticated_all" ON submission_status FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "submission_status_anon_all" ON submission_status;
CREATE POLICY "submission_status_anon_all" ON submission_status FOR ALL TO anon USING (true) WITH CHECK (true);

-- application_data
CREATE TABLE IF NOT EXISTS application_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  index_number TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id, index_number)
);
ALTER TABLE application_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "application_data_authenticated_all" ON application_data;
CREATE POLICY "application_data_authenticated_all" ON application_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "application_data_anon_all" ON application_data;
CREATE POLICY "application_data_anon_all" ON application_data FOR ALL TO anon USING (true) WITH CHECK (true);

-- financials_settings (one row per school_id, admission_id)
CREATE TABLE IF NOT EXISTS financials_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id)
);
ALTER TABLE financials_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "financials_settings_authenticated_all" ON financials_settings;
CREATE POLICY "financials_settings_authenticated_all" ON financials_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "financials_settings_anon_all" ON financials_settings;
CREATE POLICY "financials_settings_anon_all" ON financials_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- form_settings
CREATE TABLE IF NOT EXISTS form_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id)
);
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_settings_authenticated_all" ON form_settings;
CREATE POLICY "form_settings_authenticated_all" ON form_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "form_settings_anon_all" ON form_settings;
CREATE POLICY "form_settings_anon_all" ON form_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- admission_settings
CREATE TABLE IF NOT EXISTS admission_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, admission_id)
);
ALTER TABLE admission_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admission_settings_authenticated_all" ON admission_settings;
CREATE POLICY "admission_settings_authenticated_all" ON admission_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admission_settings_anon_all" ON admission_settings;
CREATE POLICY "admission_settings_anon_all" ON admission_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- Allow anon full access on students, credentials, payment_status for demo (app uses anon key)
DROP POLICY IF EXISTS "students_anon_all" ON students;
CREATE POLICY "students_anon_all" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "credentials_anon_all" ON credentials;
CREATE POLICY "credentials_anon_all" ON credentials FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "payment_status_anon_all" ON payment_status;
CREATE POLICY "payment_status_anon_all" ON payment_status FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_submission_status_lookup ON submission_status(school_id, admission_id, index_number);
CREATE INDEX IF NOT EXISTS idx_application_data_lookup ON application_data(school_id, admission_id, index_number);
