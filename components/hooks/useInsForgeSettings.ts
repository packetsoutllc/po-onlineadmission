/**
 * Hooks that read/write settings (financials, form, admission) from InsForge when configured,
 * otherwise from localStorage. Same key patterns as the rest of the app.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getInsForgeClient, isInsForgeConfigured } from "../../lib/insforgeClient";
import {
  fetchFinancialsSettings,
  upsertFinancialsSettings,
  fetchFormSettings,
  upsertFormSettings,
  fetchAdmissionSettings,
  upsertAdmissionSettings,
} from "../../lib/insforgeData";
import { useLocalStorage } from "./useLocalStorage";

function useInsForgeSettingsGeneric<T extends Record<string, unknown>>(
  storageKey: string | null,
  initialValue: T,
  fetchFn: (client: ReturnType<typeof getInsForgeClient>, schoolId: string, admissionId: string) => Promise<T>,
  upsertFn: (client: ReturnType<typeof getInsForgeClient>, schoolId: string, admissionId: string, data: T) => Promise<void>,
  schoolId: string | undefined,
  admissionId: string | undefined
): [T, (value: T | ((prev: T) => T)) => void, boolean, string | null] {
  const [localValue, setLocalValue] = useLocalStorage<T>(storageKey ?? "null", initialValue);
  const [value, setValueState] = useState<T>(initialValue);
  const valueRef = useRef<T>(value);
  valueRef.current = value;
  const [loading, setLoading] = useState(!!(isInsForgeConfigured() && schoolId && admissionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInsForgeConfigured() || !schoolId || !admissionId) {
      setValueState(localValue);
      setLoading(false);
      return;
    }
    const client = getInsForgeClient();
    if (!client) {
      setValueState(localValue);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn(client, schoolId, admissionId)
      .then((data) => {
        if (!cancelled) setValueState(data as T);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load");
          setValueState(localValue);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolId, admissionId, storageKey]);

  useEffect(() => {
    if (!isInsForgeConfigured()) setValueState(localValue);
  }, [localValue, isInsForgeConfigured()]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const nextVal = typeof next === "function" ? (next as (p: T) => T)(valueRef.current) : next;
      setValueState(nextVal);
      setLocalValue(nextVal);
      if (isInsForgeConfigured() && schoolId && admissionId) {
        const client = getInsForgeClient();
        if (client) {
          upsertFn(client, schoolId, admissionId, nextVal).catch((e) => setError(e?.message ?? "Failed to save"));
        }
      }
    },
    [schoolId, admissionId, setLocalValue]
  );

  return [value, setValue, loading, error];
}

const defaultFinancials: Record<string, unknown> = {
  voucherPrice: "50",
  gatewayStatus: true,
  requirementPolicy: "all",
  targetedStudents: [],
  exemptedStudents: [],
  gateways: [{ id: "gw_1", provider: "paystack", label: "Paystack (Primary)", publicKey: "pk_live_...", secretKey: "", enabled: true }],
  applicationList: ["Official Admission Letter", "Student Prospectus (Hard & Soft Copy)", "Personal Record Form", "AI-Powered Passport Photo Editing", "SMS Confirmation Alerts"],
  docApplicationList: ["Official Admission Letter", "Student Prospectus", "Personal Record Form", "Official Receipt"],
  docAccessFeeEnabled: false,
  docAccessFeePrice: "",
  docAccessFeeTarget: "both",
};

export function useInsForgeFinancialsSettings(
  selectedSchool: { id: string } | null | undefined,
  selectedAdmission: { id: string } | null | undefined
) {
  const schoolId = selectedSchool?.id;
  const admissionId = selectedAdmission?.id;
  const storageKey = schoolId && admissionId ? `financialsSettings_${schoolId}_${admissionId}` : null;
  return useInsForgeSettingsGeneric(
    storageKey,
    defaultFinancials,
    fetchFinancialsSettings as (c: ReturnType<typeof getInsForgeClient>, s: string, a: string) => Promise<Record<string, unknown>>,
    upsertFinancialsSettings,
    schoolId,
    admissionId
  );
}

const defaultFormSettings: Record<string, unknown> = { nameSystem: "full", fields: [] };

export function useInsForgeFormSettings(
  selectedSchool: { id: string } | null | undefined,
  selectedAdmission: { id: string } | null | undefined
) {
  const schoolId = selectedSchool?.id;
  const admissionId = selectedAdmission?.id;
  const storageKey = schoolId && admissionId ? `formSettings_${schoolId}_${admissionId}` : null;
  return useInsForgeSettingsGeneric(
    storageKey,
    defaultFormSettings,
    fetchFormSettings as (c: ReturnType<typeof getInsForgeClient>, s: string, a: string) => Promise<Record<string, unknown>>,
    upsertFormSettings,
    schoolId,
    admissionId
  );
}

const defaultAdmissionSettings: Record<string, unknown> = {
  adminOnlyAccess: false,
  autoApproveProspective: false,
  autoAdmitPolicy: "all",
  autoAdmitStudents: [],
  autoApproveProtocol: false,
  autoPlacePolicy: "all",
  autoPlaceStudents: [],
  houseAssignmentMethod: "automatic",
  enableRoomManagement: true,
  dormAssignmentMethod: "automatic",
  activateWhatsappId: false,
  enableProtocolApplication: true,
  allowStudentEdit: true,
  allowOfficialEditRequests: true,
  autoApproveOfficialEdits: false,
  serialNumberFormat: "numeric",
  serialNumberLength: 10,
  pinFormat: "numeric",
  pinLength: 5,
  maintenanceTitle: "Site under maintenance",
  maintenanceMessage: "The online admission system is currently offline.",
  maintenanceCountdownEnd: null,
};

export function useInsForgeAdmissionSettings(
  selectedSchool: { id: string } | null | undefined,
  selectedAdmission: { id: string } | null | undefined
) {
  const schoolId = selectedSchool?.id;
  const admissionId = selectedAdmission?.id;
  const storageKey = schoolId && admissionId ? `admissionSettings_${schoolId}_${admissionId}` : null;
  return useInsForgeSettingsGeneric(
    storageKey,
    defaultAdmissionSettings,
    fetchAdmissionSettings as (c: ReturnType<typeof getInsForgeClient>, s: string, a: string) => Promise<Record<string, unknown>>,
    upsertAdmissionSettings,
    schoolId,
    admissionId
  );
}

// --- Students (admin list for selected school/admission) ---
import {
  fetchStudents,
  upsertStudent,
  deleteStudent as deleteStudentDb,
} from "../../lib/insforgeData";

export function useInsForgeStudents<T extends { id: string; schoolId: string; admissionId: string; indexNumber: string; name: string; programme: string; gender: string; aggregate: string; status: string; classId?: string; houseId?: string; dormitoryId?: string; feeStatus: string; residence: string; admissionDate: string; paymentDate?: string | null; phoneNumber?: string; isProtocol?: boolean }>(
  selectedSchool: { id: string } | null | undefined,
  selectedAdmission: { id: string } | null | undefined,
  fallbackStudents: T[],
  setFallbackStudents: React.Dispatch<React.SetStateAction<T[]>>
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean, string | null] {
  const schoolId = selectedSchool?.id;
  const admissionId = selectedAdmission?.id;

  const [students, setStudentsState] = useState<T[]>([]);
  const [loading, setLoading] = useState(!!(isInsForgeConfigured() && schoolId && admissionId));
  const [error, setError] = useState<string | null>(null);

  const filteredFallback = useMemo(() => {
    if (!schoolId || !admissionId) return [];
    return fallbackStudents.filter((s) => s.schoolId === schoolId && s.admissionId === admissionId);
  }, [fallbackStudents, schoolId, admissionId]);

  useEffect(() => {
    if (!isInsForgeConfigured() || !schoolId || !admissionId) {
      setStudentsState(filteredFallback);
      setLoading(false);
      return;
    }
    const client = getInsForgeClient();
    if (!client) {
      setStudentsState(filteredFallback);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchStudents(client, schoolId, admissionId)
      .then((rows) => {
        if (!cancelled) setStudentsState(rows as T[]);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load students");
          setStudentsState(filteredFallback);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolId, admissionId, filteredFallback.length]);

  useEffect(() => {
    if (!isInsForgeConfigured()) setStudentsState(filteredFallback);
  }, [filteredFallback, isInsForgeConfigured()]);

  const setStudents = useCallback(
    (updater: React.SetStateAction<T[]>) => {
      if (!isInsForgeConfigured() || !schoolId || !admissionId) {
        setFallbackStudents((prev) => {
          const rest = prev.filter((s) => !(s.schoolId === schoolId && s.admissionId === admissionId));
          const current = prev.filter((s) => s.schoolId === schoolId && s.admissionId === admissionId);
          const next = typeof updater === "function" ? updater(current) : updater;
          return [...rest, ...(Array.isArray(next) ? next : [next])];
        });
        return;
      }
      setStudentsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const client = getInsForgeClient();
        if (client) {
          const nextIds = new Set((Array.isArray(next) ? next : [next]).map((s) => s.id));
          prev.forEach((s) => {
            if (!nextIds.has(s.id)) {
              deleteStudentDb(client, s.id).catch((e) => setError(e?.message ?? "Failed to delete"));
            }
          });
          (Array.isArray(next) ? next : [next]).forEach((s) => {
            upsertStudent(client, {
              id: s.id,
              schoolId: s.schoolId,
              admissionId: s.admissionId,
              indexNumber: s.indexNumber,
              name: s.name,
              programme: s.programme,
              gender: s.gender,
              aggregate: s.aggregate,
              status: s.status,
              classId: s.classId ?? "",
              houseId: s.houseId ?? "",
              dormitoryId: s.dormitoryId,
              feeStatus: s.feeStatus,
              residence: s.residence,
              admissionDate: s.admissionDate,
              paymentDate: s.paymentDate ?? null,
              phoneNumber: s.phoneNumber,
              isProtocol: s.isProtocol,
            }).catch((e) => setError(e?.message ?? "Failed to save"));
          });
        }
        return next;
      });
    },
    [schoolId, admissionId, setFallbackStudents]
  );

  const effectiveStudents = isInsForgeConfigured() && schoolId && admissionId ? students : filteredFallback;
  return [effectiveStudents, setStudents, loading, error];
}
