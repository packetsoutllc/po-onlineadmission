-- 007: Allow anon to insert/update/delete schools and admissions so admin panel can persist without InsForge Auth.
-- Run after 003.

DROP POLICY IF EXISTS "schools_anon_select" ON schools;
CREATE POLICY "schools_anon_select" ON schools FOR SELECT TO anon USING (true);
CREATE POLICY "schools_anon_insert" ON schools FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "schools_anon_update" ON schools FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "schools_anon_delete" ON schools FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "admissions_anon_select" ON admissions;
CREATE POLICY "admissions_anon_select" ON admissions FOR SELECT TO anon USING (true);
CREATE POLICY "admissions_anon_insert" ON admissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "admissions_anon_update" ON admissions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "admissions_anon_delete" ON admissions FOR DELETE TO anon USING (true);
