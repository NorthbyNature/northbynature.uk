// netlify/functions/scan-ticket.js
const { getSupabaseAdmin } = require("./_supabase");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Door secret check (protect endpoint)
    const secret = event.headers["x-door-secret"];
    if (!process.env.DOOR_SCAN_SECRET || secret !== process.env.DOOR_SCAN_SECRET) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const { ticket_code, scanned_by } = body;

    if (!ticket_code) {
      return { statusCode: 400, body: JSON.stringify({ error: "ticket_code is required" }) };
    }

    const supabase = getSupabaseAdmin();

    // Fetch ticket for readable responses
    const { data: ticket, error: getErr } = await supabase
      .from("tickets")
      .select("id,event_sku,ticket_type,status,scanned_at,order_email")
      .eq("ticket_code", ticket_code)
      .maybeSingle();

    if (getErr) return { statusCode: 500, body: JSON.stringify({ error: getErr.message }) };
    if (!ticket) return { statusCode: 404, body: JSON.stringify({ ok: false, reason: "not_found" }) };

    if (ticket.status === "scanned") {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, reason: "already_scanned", scanned_at: ticket.scanned_at, ticket }),
      };
    }

    if (ticket.status !== "issued") {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, reason: "not_issuable_status", ticket }),
      };
    }

    // Atomic update
    const { data: updated, error: updErr } = await supabase
      .from("tickets")
      .update({
        status: "scanned",
        scanned_at: new Date().toISOString(),
        scanned_by: scanned_by || null,
      })
      .eq("ticket_code", ticket_code)
      .eq("status", "issued")
      .select("id,event_sku,ticket_type,status,scanned_at")
      .maybeSingle();

    if (updErr) return { statusCode: 500, body: JSON.stringify({ error: updErr.message }) };

    if (!updated) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, reason: "already_scanned_race", ticket }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, ticket: updated }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};