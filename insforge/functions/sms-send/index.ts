// SMS send: log and optionally send via provider. Set SMS_PROVIDER_URL or use InsForge secrets for provider API.
import { createClient } from "npm:@insforge/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const baseUrl = Deno.env.get("INSFORGE_BASE_URL");
    const apiKey = Deno.env.get("API_KEY");
    if (!baseUrl || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = createClient({ baseUrl, anonKey: apiKey });
    const body = await req.json().catch(() => ({}));
    const schoolId = body.schoolId ?? body.school_id;
    const admissionId = body.admissionId ?? body.admission_id;
    const indexNumber = body.indexNumber ?? body.index_number;
    const phoneNumber = body.phoneNumber ?? body.phone_number;
    const messageType = body.messageType ?? body.message_type ?? "credentials";

    if (!schoolId || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Missing schoolId or phoneNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error } = await client.database.from("sms_notification_log").insert([
      {
        school_id: schoolId,
        admission_id: admissionId ?? null,
        index_number: indexNumber ?? null,
        phone_number: String(phoneNumber),
        message_type: messageType,
      },
    ]);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message ?? "Failed to log SMS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "SMS request logged" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
