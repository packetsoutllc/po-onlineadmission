-- 005: Seed credentials for sample students (plain PIN in pin_hash for RPC comparison).
-- Run after 004. Test login: Serial PSHS001 / PIN 12345 (first student), etc.

INSERT INTO credentials (school_id, admission_id, serial_number, index_number, pin_hash)
VALUES
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'PSHS001', '12345678901225', '12345'),
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'PSHS002', '98765432109825', '12345'),
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'PSHS003', '11111111111125', '12345'),
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'PSHS004', '22222222222225', '12345')
ON CONFLICT (school_id, admission_id, serial_number) DO UPDATE SET index_number = EXCLUDED.index_number, pin_hash = EXCLUDED.pin_hash;
