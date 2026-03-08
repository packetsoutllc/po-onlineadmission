/**
 * InsForge data layer: fetch and map DB rows to app types (School, Admission, etc.).
 * Use getInsForgeClient() from insforgeClient; these helpers assume client is configured.
 */
import type { InsForgeClient } from "@insforge/sdk";
import { normalizeNewlines } from "../utils/text";

export interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  status: string;
  created_at?: string | null;
  home_region?: string | null;
}

export interface AdmissionRow {
  id: string;
  school_id: string;
  title: string;
  slug: string;
  description?: string | null;
  date?: string | null;
  auth_method?: string | null;
  status: string;
  portal_status?: string | null;
  applicants_placed?: number | null;
  students_admitted?: number | null;
  index_hint?: string | null;
  head_of_school_number?: string | null;
  head_of_it_number?: string | null;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  status: "Active" | "Inactive";
  dateCreated: string;
  homeRegion?: string;
}

export interface Admission {
  id: string;
  schoolId: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  authMethod: string;
  status: "Active" | "Archived";
  portalStatus?: "opened" | "closed" | "yet_to_open";
  applicantsPlaced: number;
  studentsAdmitted: number;
  indexHint?: string;
  headOfSchoolNumber?: string;
  headOfItNumber?: string;
}

function mapSchool(row: SchoolRow): School {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo ?? undefined,
    status: row.status === "Inactive" ? "Inactive" : "Active",
    dateCreated: row.created_at ?? new Date().toISOString(),
    homeRegion: row.home_region ?? undefined,
  };
}

function mapAdmission(row: AdmissionRow): Admission {
  return {
    id: row.id,
    schoolId: row.school_id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    date: row.date ?? "",
    authMethod: row.auth_method ?? "Index number only",
    status: row.status === "Archived" ? "Archived" : "Active",
    portalStatus: row.portal_status as Admission["portalStatus"] | undefined,
    applicantsPlaced: row.applicants_placed ?? 0,
    studentsAdmitted: row.students_admitted ?? 0,
    indexHint: row.index_hint != null ? normalizeNewlines(row.index_hint) : undefined,
    headOfSchoolNumber: row.head_of_school_number ?? undefined,
    headOfItNumber: row.head_of_it_number ?? undefined,
  };
}

export async function fetchSchools(client: InsForgeClient): Promise<School[]> {
  const { data, error } = await client.database.from("schools").select("id,name,slug,logo,status,home_region,created_at");
  if (error) throw new Error(error.message ?? "Failed to fetch schools");
  return (Array.isArray(data) ? data : []).map((r: SchoolRow) => mapSchool(r));
}

export async function fetchAdmissions(client: InsForgeClient): Promise<Admission[]> {
  const { data, error } = await client.database.from("admissions").select("id,school_id,title,slug,description,date,auth_method,status,portal_status,applicants_placed,students_admitted,index_hint,head_of_school_number,head_of_it_number");
  if (error) throw new Error(error.message ?? "Failed to fetch admissions");
  return (data ?? []).map((r: AdmissionRow) => mapAdmission(r));
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function upsertSchool(client: InsForgeClient, school: School): Promise<void> {
  const payload: Record<string, unknown> = {
    name: school.name,
    slug: school.slug,
    logo: school.logo ?? null,
    status: school.status,
    home_region: school.homeRegion ?? null,
  };
  if (school.id && UUID_REGEX.test(school.id)) payload.id = school.id;
  const { error } = await client.database.from("schools").upsert(payload, { onConflict: "slug" });
  if (error) throw new Error(error.message ?? "Failed to upsert school");
}

export async function upsertAdmission(client: InsForgeClient, admission: Admission): Promise<void> {
  const payload: Record<string, unknown> = {
    school_id: admission.schoolId,
    title: admission.title,
    slug: admission.slug,
    description: admission.description ?? "",
    date: admission.date ?? "",
    auth_method: admission.authMethod ?? "Index number only",
    status: admission.status,
    portal_status: admission.portalStatus ?? "opened",
    applicants_placed: admission.applicantsPlaced ?? 0,
    students_admitted: admission.studentsAdmitted ?? 0,
    index_hint: admission.indexHint ?? null,
    head_of_school_number: admission.headOfSchoolNumber ?? null,
    head_of_it_number: admission.headOfItNumber ?? null,
  };
  if (admission.id && UUID_REGEX.test(admission.id)) payload.id = admission.id;
  const { error } = await client.database.from("admissions").upsert(payload, { onConflict: "school_id,slug" });
  if (error) throw new Error(error.message ?? "Failed to upsert admission");
}

export async function deleteSchool(client: InsForgeClient, schoolId: string): Promise<void> {
  const { error } = await client.database.from("schools").delete().eq("id", schoolId);
  if (error) throw new Error(error.message ?? "Failed to delete school");
}

export async function deleteAdmission(client: InsForgeClient, admissionId: string): Promise<void> {
  const { error } = await client.database.from("admissions").delete().eq("id", admissionId);
  if (error) throw new Error(error.message ?? "Failed to delete admission");
}

export interface VerifyStudentPayload {
  id: string;
  name: string;
  indexNumber: string;
  programme: string;
  gender: string;
  residence: string;
  aggregate: string;
  schoolId: string;
  admissionId: string;
  status?: string;
  feeStatus?: string;
  isProtocol?: boolean;
  phoneNumber?: string | null;
}

export interface VerifyResult {
  found: boolean;
  student?: VerifyStudentPayload;
  paidInitial?: boolean;
  paidDocAccess?: boolean;
  submitted?: boolean;
}

export async function invokeVerify(
  baseUrl: string,
  schoolSlug: string,
  admissionSlug: string,
  indexNumber: string
): Promise<VerifyResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/functions/verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schoolSlug, admissionSlug, indexNumber }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Verification failed");
  return json;
}

// --- Settings (financials, form, admission) ---
export async function fetchFinancialsSettings(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await client.database
    .from("financials_settings")
    .select("settings")
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Failed to fetch financials settings");
  return (data?.settings as Record<string, unknown>) ?? {};
}

export async function upsertFinancialsSettings(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const { error } = await client.database.from("financials_settings").upsert(
    { school_id: schoolId, admission_id: admissionId, settings, updated_at: new Date().toISOString() },
    { onConflict: "school_id,admission_id" }
  );
  if (error) throw new Error(error.message ?? "Failed to save financials settings");
}

export async function fetchFormSettings(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await client.database
    .from("form_settings")
    .select("settings")
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Failed to fetch form settings");
  return (data?.settings as Record<string, unknown>) ?? {};
}

export async function upsertFormSettings(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const { error } = await client.database.from("form_settings").upsert(
    { school_id: schoolId, admission_id: admissionId, settings, updated_at: new Date().toISOString() },
    { onConflict: "school_id,admission_id" }
  );
  if (error) throw new Error(error.message ?? "Failed to save form settings");
}

export async function fetchAdmissionSettings(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await client.database
    .from("admission_settings")
    .select("settings")
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Failed to fetch admission settings");
  return (data?.settings as Record<string, unknown>) ?? {};
}

export async function upsertAdmissionSettings(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const { error } = await client.database.from("admission_settings").upsert(
    { school_id: schoolId, admission_id: admissionId, settings, updated_at: new Date().toISOString() },
    { onConflict: "school_id,admission_id" }
  );
  if (error) throw new Error(error.message ?? "Failed to save admission settings");
}

// --- Submission status ---
export async function fetchSubmissionStatus(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string
): Promise<{ submitted: boolean }> {
  const { data, error } = await client.database
    .from("submission_status")
    .select("status")
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .eq("index_number", indexNumber)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Failed to fetch submission status");
  return { submitted: data?.status === "submitted" };
}

export async function upsertSubmissionStatus(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string,
  submitted: boolean
): Promise<void> {
  const { error } = await client.database.from("submission_status").upsert(
    {
      school_id: schoolId,
      admission_id: admissionId,
      index_number: indexNumber,
      status: submitted ? "submitted" : "draft",
      submitted_at: submitted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,admission_id,index_number" }
  );
  if (error) throw new Error(error.message ?? "Failed to save submission status");
}

// --- Payment status ---
export async function fetchPaymentStatus(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string
): Promise<{ paidInitial: boolean; paidDocAccess: boolean }> {
  const { data, error } = await client.database
    .from("payment_status")
    .select("payment_type,paid")
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .eq("index_number", indexNumber);
  if (error) throw new Error(error.message ?? "Failed to fetch payment status");
  const rows = (data ?? []) as { payment_type: string; paid: boolean }[];
  const paidInitial = rows.find((r) => r.payment_type === "initial")?.paid ?? false;
  const paidDocAccess = rows.find((r) => r.payment_type === "doc_access")?.paid ?? false;
  return { paidInitial, paidDocAccess };
}

export async function upsertPaymentStatus(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string,
  paymentType: "initial" | "doc_access",
  paid: boolean
): Promise<void> {
  const { error } = await client.database.from("payment_status").upsert(
    {
      school_id: schoolId,
      admission_id: admissionId,
      index_number: indexNumber,
      payment_type: paymentType,
      paid,
      paid_at: paid ? new Date().toISOString() : null,
      reference: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,admission_id,index_number,payment_type" }
  );
  if (error) throw new Error(error.message ?? "Failed to save payment status");
}

// --- Credentials (pin stored in pin_hash for RPC comparison; no hashing) ---
export async function fetchCredentials(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string
): Promise<{ serialNumber: string; pin: string } | null> {
  const { data, error } = await client.database
    .from("credentials")
    .select("serial_number,pin_hash")
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .eq("index_number", indexNumber)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Failed to fetch credentials");
  if (!data) return null;
  return {
    serialNumber: (data as { serial_number: string; pin_hash: string }).serial_number,
    pin: (data as { serial_number: string; pin_hash: string }).pin_hash,
  };
}

export async function upsertCredentials(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string,
  serialNumber: string,
  pin: string
): Promise<void> {
  const { error } = await client.database.from("credentials").upsert(
    {
      school_id: schoolId,
      admission_id: admissionId,
      serial_number: serialNumber,
      index_number: indexNumber,
      pin_hash: pin,
    },
    { onConflict: "school_id,admission_id,serial_number" }
  );
  if (error) throw new Error(error.message ?? "Failed to save credentials");
}

// --- Application data ---
export async function fetchApplicationData(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string
): Promise<Record<string, unknown>> {
  const { data, error } = await client.database
    .from("application_data")
    .select("data")
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .eq("index_number", indexNumber)
    .maybeSingle();
  if (error) throw new Error(error.message ?? "Failed to fetch application data");
  return (data?.data as Record<string, unknown>) ?? {};
}

export async function upsertApplicationData(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string,
  indexNumber: string,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await client.database.from("application_data").upsert(
    {
      school_id: schoolId,
      admission_id: admissionId,
      index_number: indexNumber,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id,admission_id,index_number" }
  );
  if (error) throw new Error(error.message ?? "Failed to save application data");
}

// --- Students (admin list) ---
export interface StudentRow {
  id: string;
  school_id: string;
  admission_id: string;
  index_number: string;
  name: string | null;
  programme: string | null;
  gender: string | null;
  residence: string | null;
  aggregate: string | null;
  status: string | null;
  fee_status: string | null;
  is_protocol: boolean | null;
  phone_number: string | null;
  class_id: string | null;
  house_id: string | null;
  dormitory_id: string | null;
  admission_date: string | null;
  payment_date: string | null;
}

export type StudentStatus = "Admitted" | "Placed" | "Pending" | "Rejected" | "Prospective";

export interface AdminStudentRow {
  id: string;
  schoolId: string;
  admissionId: string;
  indexNumber: string;
  name: string;
  programme: string;
  gender: "Male" | "Female";
  aggregate: string;
  status: StudentStatus;
  classId: string;
  houseId: string;
  dormitoryId?: string;
  feeStatus: "Paid" | "Unpaid";
  residence: "Boarding" | "Day";
  admissionDate: string;
  paymentDate?: string | null;
  phoneNumber?: string;
  isProtocol?: boolean;
}

function mapStudentRow(row: StudentRow): AdminStudentRow {
  return {
    id: row.id,
    schoolId: row.school_id,
    admissionId: row.admission_id,
    indexNumber: row.index_number,
    name: row.name ?? "",
    programme: row.programme ?? "",
    gender: (row.gender === "Female" ? "Female" : "Male") as "Male" | "Female",
    aggregate: row.aggregate ?? "",
    status: (row.status as StudentStatus) ?? "Placed",
    classId: row.class_id ?? "",
    houseId: row.house_id ?? "",
    dormitoryId: row.dormitory_id ?? undefined,
    feeStatus: row.fee_status === "Paid" ? "Paid" : "Unpaid",
    residence: (row.residence === "Day" ? "Day" : "Boarding") as "Boarding" | "Day",
    admissionDate: row.admission_date ?? new Date().toISOString(),
    paymentDate: row.payment_date ?? null,
    phoneNumber: row.phone_number ?? undefined,
    isProtocol: row.is_protocol ?? false,
  };
}

export async function fetchStudents(
  client: InsForgeClient,
  schoolId: string,
  admissionId: string
): Promise<AdminStudentRow[]> {
  const { data, error } = await client.database
    .from("students")
    .select(
      "id,school_id,admission_id,index_number,name,programme,gender,residence,aggregate,status,fee_status,is_protocol,phone_number,class_id,house_id,dormitory_id,admission_date,payment_date"
    )
    .eq("school_id", schoolId)
    .eq("admission_id", admissionId)
    .order("index_number");
  if (error) throw new Error(error.message ?? "Failed to fetch students");
  return (data ?? []).map((r: StudentRow) => mapStudentRow(r));
}

export async function upsertStudent(
  client: InsForgeClient,
  student: {
    id?: string;
    schoolId: string;
    admissionId: string;
    indexNumber: string;
    name: string;
    programme: string;
    gender: string;
    aggregate: string;
    status: string;
    classId?: string;
    houseId?: string;
    dormitoryId?: string;
    feeStatus: string;
    residence: string;
    admissionDate: string;
    paymentDate?: string | null;
    phoneNumber?: string;
    isProtocol?: boolean;
  }
): Promise<void> {
  const payload = {
    id: student.id ?? undefined,
    school_id: student.schoolId,
    admission_id: student.admissionId,
    index_number: student.indexNumber,
    name: student.name,
    programme: student.programme,
    gender: student.gender,
    aggregate: student.aggregate,
    status: student.status,
    class_id: student.classId ?? null,
    house_id: student.houseId ?? null,
    dormitory_id: student.dormitoryId ?? null,
    fee_status: student.feeStatus,
    residence: student.residence,
    admission_date: student.admissionDate,
    payment_date: student.paymentDate ?? null,
    phone_number: student.phoneNumber ?? null,
    is_protocol: student.isProtocol ?? false,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.database.from("students").upsert(payload, {
    onConflict: "school_id,admission_id,index_number",
  });
  if (error) throw new Error(error.message ?? "Failed to save student");
}

// --- Applicant auth (serial + PIN) ---
export interface ApplicantAuthResult {
  valid: boolean;
  indexNumber?: string;
  schoolId?: string;
  admissionId?: string;
  error?: string;
}

export async function invokeApplicantAuth(
  baseUrl: string,
  schoolId: string,
  admissionId: string,
  serialNumber: string,
  pin: string
): Promise<ApplicantAuthResult> {
  const url = `${baseUrl.replace(/\/$/, "")}/functions/applicant-auth`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schoolId, admissionId, serialNumber, pin }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { valid: false, error: json.error ?? "Auth failed" };
  return { valid: json.valid === true, indexNumber: json.indexNumber, schoolId: json.schoolId, admissionId: json.admissionId };
}

export async function deleteStudent(
  client: InsForgeClient,
  studentId: string
): Promise<void> {
  const { error } = await client.database.from("students").delete().eq("id", studentId);
  if (error) throw new Error(error.message ?? "Failed to delete student");
}
