-- 004: Seed one school, one admission, and sample students for peki-senior-high / 2025-admissions.
-- Uses fixed UUIDs so slugs are consistent. Run after 003.

INSERT INTO schools (id, name, slug, logo, status, home_region)
VALUES (
  'a1000000-0000-4000-8000-000000000001'::uuid,
  'Peki Senior High School',
  'peki-senior-high',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=200&h=200&auto=format&fit=crop',
  'Active',
  'Volta'
)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo, status = EXCLUDED.status, home_region = EXCLUDED.home_region;

INSERT INTO admissions (id, school_id, title, slug, portal_status, description, date, auth_method, status, applicants_placed, students_admitted, index_hint, head_of_school_number, head_of_it_number)
VALUES (
  'b2000000-0000-4000-8000-000000000002'::uuid,
  'a1000000-0000-4000-8000-000000000001'::uuid,
  '2025 Admissions',
  '2025-admissions',
  'opened',
  '',
  '2025-01-01',
  'Index number only',
  'Active',
  400,
  350,
  'Add the year you completed JHS\nExample: xxxxxxxxxxxx25',
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
  ('c3000000-0000-4000-8000-000000000001'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, '12345678901225', 'JOHN DOE', 'General Science', 'Male', 'Boarding', '08', 'Admitted', 'Paid', false, NULL),
  ('c3000000-0000-4000-8000-000000000002'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, '98765432109825', 'JANE SMITH', 'Visual Arts', 'Female', 'Boarding', '12', 'Admitted', 'Paid', false, NULL),
  ('c3000000-0000-4000-8000-000000000003'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, '11111111111125', 'ABABIO PATIENCE', 'General Arts', 'Female', 'Boarding', '10', 'Placed', 'Unpaid', false, NULL),
  ('c3000000-0000-4000-8000-000000000004'::uuid, 'a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, '22222222222225', 'KOFI MENSAH', 'General Science', 'Male', 'Boarding', '09', 'Placed', 'Unpaid', false, NULL)
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
