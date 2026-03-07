// AI chat: proxy to InsForge AI chat completions. Accepts messages and optional model/systemInstruction.
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
    const anonKey = Deno.env.get("ANON_KEY");
    if (!baseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = createClient({ baseUrl, anonKey });
    const body = await req.json().catch(() => ({}));
    const messages = body.messages ?? [];
    const model = body.model ?? "openai/gpt-4o-mini";
    const systemInstruction = body.systemInstruction ?? body.system_instruction;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid messages array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullMessages = systemInstruction
      ? [{ role: "system" as const, content: systemInstruction }, ...messages]
      : messages;

    const completion = await client.ai.chat.completions.create({
      model,
      messages: fullMessages,
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? body.max_tokens ?? 1024,
    });

    const content = completion?.choices?.[0]?.message?.content ?? "";
    return new Response(
      JSON.stringify({ content, usage: completion?.usage ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
