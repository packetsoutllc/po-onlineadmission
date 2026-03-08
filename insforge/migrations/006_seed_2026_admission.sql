-- 006: Seed 2026 Admissions for Peki Senior High so portal and DB stay in sync.
-- Run after 004. Adds one admission and sample students for verification.

INSERT INTO admissions (id, school_id, title, slug, portal_status, description, date, auth_method, status, applicants_placed, students_admitted, index_hint, head_of_school_number, head_of_it_number)
VALUES (
  'b2000000-0000-4000-8000-000000000003'::uuid,
  'a1000000-0000-4000-8000-000000000001'::uuid,
  '2026 Admissions',
  '2026-admissions',
  'opened',
  '',
  '2026-01-01',
  'Index number only',
  'Active',
  400,
  350,
  'Add the year you completed JHS\nExample: xxxxxxxxxxxx26',
  '0244889791',
  '0243339546'
)
ON CONFLICT (school_id, slug) DO UPDATE SET
  title = EXCLUDED.title,
  portal_status = EXCLUDED.portal_status,
  description = EXCLUDED.description,
  date = EXCLUDED.date,
  auth_method = EXCLUDED.auth_method,
  status = EXCLUDED.status,
  applicants_placed = EXCLUDED.applicants_placed,
  students_admitted = EXCLUDED.students_admitted,
  index_hint = EXCLUDED.index_hint,
  head_of_school_number = EXCLUDED.head_of_school_number,
  head_of_it_number = EXCLUDED.head_of_it_number;

INSERT INTO students (id, school_id, admission_id, index_number, name, programme, gender, residence, aggregate, status, fee_status, is_protocol, phone_number)
VALUES
  ('c3000000-0000-4000-8000-000000000011'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, '12345678901226', 'JOHN DOE', 'General Science', 'Male', 'Boarding', '08', 'Admitted', 'Paid', false, NULL),
  ('c3000000-0000-4000-8000-000000000012'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, '98765432109826', 'JANE SMITH', 'Visual Arts', 'Female', 'Boarding', '12', 'Placed', 'Unpaid', false, NULL)
ON CONFLICT (school_id, admission_id, index_number) DO UPDATE SET
  name = EXCLUDED.name,
  programme = EXCLUDED.programme,
  gender = EXCLUDED.gender,
  residence = EXCLUDED.residence,
  aggregate = EXCLUDED.aggregate,
  status = EXCLUDED.status,
  fee_status = EXCLUDED.fee_status,
  is_protocol = EXCLUDED.is_protocol,
  phone_number = EXCLUDED.phone_number;

-- Credentials for 2026 applicant login (Serial / PIN)
INSERT INTO credentials (school_id, admission_id, serial_number, index_number, pin_hash)
VALUES
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, 'PSHS001', '12345678901226', '12345'),
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000003'::uuid, 'PSHS002', '98765432109826', '12345')
ON CONFLICT (school_id, admission_id, serial_number) DO UPDATE SET index_number = EXCLUDED.index_number, pin_hash = EXCLUDED.pin_hash;
