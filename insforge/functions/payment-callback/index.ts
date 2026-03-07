// Payment callback / webhook: mark payment_status as paid.
// In production, verify webhook signature from Paystack/Flutterwave and use API key for DB write.
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
        JSON.stringify({ error: "Server misconfiguration: missing INSFORGE_BASE_URL or API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use API key (service role) so RLS allows writing to payment_status
    const client = createClient({ baseUrl, anonKey: apiKey });
    const body = await req.json().catch(() => ({}));
    const schoolId = body.schoolId ?? body.school_id;
    const admissionId = body.admissionId ?? body.admission_id;
    const indexNumber = body.indexNumber ?? body.index_number;
    const paymentType = body.paymentType ?? body.payment_type ?? "initial";
    const reference = body.reference ?? body.reference_id;

    if (!schoolId || !admissionId || !indexNumber) {
      return new Response(
        JSON.stringify({ error: "Missing schoolId, admissionId, or indexNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert payment_status (requires authenticated or service role; anon cannot write)
    // For now return instructions; frontend can still use localStorage until we add API key in function
    const { error } = await client.database.from("payment_status").upsert(
      [
        {
          school_id: schoolId,
          admission_id: admissionId,
          index_number: indexNumber,
          payment_type: paymentType,
          paid: true,
          paid_at: new Date().toISOString(),
          reference: reference ?? null,
        },
      ],
      { onConflict: "school_id,admission_id,index_number,payment_type" }
    );

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message ?? "Failed to record payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Payment recorded" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
