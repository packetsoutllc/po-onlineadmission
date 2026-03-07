CREATE OR REPLACE FUNCTION verify_placement(p_school_slug TEXT, p_admission_slug TEXT, p_index_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r RECORD;
BEGIN
  SELECT s.id, s.name, s.index_number, s.programme, s.gender, s.residence, s.aggregate, s.school_id, s.admission_id,
    s.status, s.fee_status, s.is_protocol, s.phone_number,
    (SELECT COALESCE(bool_or(paid), false) FROM payment_status ps WHERE ps.school_id = s.school_id AND ps.admission_id = s.admission_id AND ps.index_number = s.index_number AND ps.payment_type = 'initial') AS paid_initial,
    (SELECT COALESCE(bool_or(paid), false) FROM payment_status ps WHERE ps.school_id = s.school_id AND ps.admission_id = s.admission_id AND ps.index_number = s.index_number AND ps.payment_type = 'doc_access') AS paid_doc_access,
    (SELECT (status = 'submitted') FROM submission_status ss WHERE ss.school_id = s.school_id AND ss.admission_id = s.admission_id AND ss.index_number = s.index_number LIMIT 1) AS submitted
  INTO r
  FROM students s
  JOIN schools sc ON sc.id = s.school_id
  JOIN admissions a ON a.id = s.admission_id
  WHERE sc.slug = p_school_slug AND a.slug = p_admission_slug AND s.index_number = p_index_number
  LIMIT 1;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  RETURN jsonb_build_object(
    'found', true,
    'student', jsonb_build_object(
      'id', r.id,
      'name', r.name,
      'indexNumber', r.index_number,
      'programme', r.programme,
      'gender', r.gender,
      'residence', r.residence,
      'aggregate', r.aggregate,
      'schoolId', r.school_id,
      'admissionId', r.admission_id,
      'status', r.status,
      'feeStatus', r.fee_status,
      'isProtocol', COALESCE(r.is_protocol, false),
      'phoneNumber', r.phone_number
    ),
    'paidInitial', COALESCE(r.paid_initial, false),
    'paidDocAccess', COALESCE(r.paid_doc_access, false),
    'submitted', COALESCE(r.submitted, false)
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION verify_placement(TEXT, TEXT, TEXT) TO anon;
