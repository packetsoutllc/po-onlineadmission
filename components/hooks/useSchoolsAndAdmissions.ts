/**
 * Single source for schools and admissions: InsForge when configured, else localStorage.
 */
import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getInsForgeClient, isInsForgeConfigured } from "../../lib/insforgeClient";
import { fetchSchools, fetchAdmissions } from "../../lib/insforgeData";
import type { School, Admission } from "../admin/pages/SettingsPage";
import { initialSchools, initialAdmissions } from "../admin/pages/SettingsPage";

export interface UseSchoolsAndAdmissionsResult {
  schools: School[];
  admissions: Admission[];
  loading: boolean;
  error: string | null;
  source: "insforge" | "localStorage";
}

export function useSchoolsAndAdmissions(): UseSchoolsAndAdmissionsResult {
  const [localSchools] = useLocalStorage<School[]>("admin_schools", initialSchools);
  const [localAdmissions] = useLocalStorage<Admission[]>("admin_admissions", initialAdmissions);

  const [schools, setSchools] = useState<School[]>(localSchools);
  const [admissions, setAdmissions] = useState<Admission[]>(localAdmissions);
  const [loading, setLoading] = useState(isInsForgeConfigured());
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"insforge" | "localStorage">(
    isInsForgeConfigured() ? "insforge" : "localStorage"
  );

  useEffect(() => {
    if (!isInsForgeConfigured()) {
      setSchools(localSchools);
      setAdmissions(localAdmissions);
      setLoading(false);
      setSource("localStorage");
      return;
    }

    const client = getInsForgeClient();
    if (!client) {
      setSchools(localSchools);
      setAdmissions(localAdmissions);
      setLoading(false);
      setSource("localStorage");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchSchools(client), fetchAdmissions(client)])
      .then(([s, a]) => {
        if (!cancelled) {
          setSchools(s);
          setAdmissions(a);
          setSource("insforge");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load from backend");
          setSchools(localSchools);
          setAdmissions(localAdmissions);
          setSource("localStorage");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [localSchools, localAdmissions]);

  return { schools, admissions, loading, error, source };
}
