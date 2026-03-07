// Verification: look up student by school_slug, admission_slug, index_number.
// Uses anon client; requires verify_placement RPC (SECURITY DEFINER) to be created in DB.
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
        JSON.stringify({ error: "Server misconfiguration: missing INSFORGE_BASE_URL or ANON_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = createClient({ baseUrl, anonKey });
    const body = req.method === "POST" ? await req.json() : {};
    const schoolSlug = body.schoolSlug ?? body.school_slug ?? new URL(req.url).searchParams.get("schoolSlug");
    const admissionSlug = body.admissionSlug ?? body.admission_slug ?? new URL(req.url).searchParams.get("admissionSlug");
    const indexNumber = body.indexNumber ?? body.index_number ?? new URL(req.url).searchParams.get("indexNumber");

    if (!schoolSlug || !admissionSlug || !indexNumber) {
      return new Response(
        JSON.stringify({ error: "Missing schoolSlug, admissionSlug, or indexNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call RPC verify_placement (must be created with SECURITY DEFINER so anon can call it)
    const { data, error } = await client.database.rpc("verify_placement", {
      p_school_slug: schoolSlug,
      p_admission_slug: admissionSlug,
      p_index_number: String(indexNumber).trim(),
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message ?? "Verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data?.found) {
      return new Response(
        JSON.stringify({ found: false, error: "Record not found for this admission." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
