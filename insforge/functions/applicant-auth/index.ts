// Applicant auth: validate serial + PIN against credentials table, return session payload.
// Uses anon client; requires applicant_validate_credentials RPC or service role for credentials read.
import { createClient } from "npm:@insforge/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const baseUrl = Deno.env.get("INSFORGE_BASE_URL");
    const anonKey = Deno.env.get("ANON_KEY");
    if (!baseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = createClient({ baseUrl, anonKey });
    const body = req.method === "POST" ? await req.json() : {};
    const serialNumber = body.serialNumber ?? body.serial_number;
    const pin = body.pin;
    const schoolId = body.schoolId ?? body.school_id;
    const admissionId = body.admissionId ?? body.admission_id;

    if (!serialNumber || !pin || !schoolId || !admissionId) {
      return new Response(
        JSON.stringify({ error: "Missing serialNumber, pin, schoolId, or admissionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call RPC applicant_validate_credentials (to be created with SECURITY DEFINER)
    const { data, error } = await client.database.rpc("applicant_validate_credentials", {
      p_school_id: schoolId,
      p_admission_id: admissionId,
      p_serial_number: String(serialNumber).trim(),
      p_pin: String(pin),
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message ?? "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data?.valid) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid serial or PIN" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
