CREATE OR REPLACE FUNCTION applicant_validate_credentials(p_school_id UUID, p_admission_id UUID, p_serial_number TEXT, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r RECORD;
BEGIN
  SELECT c.index_number, c.serial_number INTO r
  FROM credentials c
  WHERE c.school_id = p_school_id AND c.admission_id = p_admission_id
    AND c.serial_number = p_serial_number AND c.pin_hash = p_pin
  LIMIT 1;
  IF r.index_number IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  RETURN jsonb_build_object('valid', true, 'indexNumber', r.index_number, 'schoolId', p_school_id, 'admissionId', p_admission_id);
END;
$fn$;
GRANT EXECUTE ON FUNCTION applicant_validate_credentials(UUID, UUID, TEXT, TEXT) TO anon;
