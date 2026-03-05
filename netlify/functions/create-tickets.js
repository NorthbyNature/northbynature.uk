// netlify/functions/create-tickets.js
const crypto = require("crypto");
const { getSupabaseAdmin } = require("./_supabase");

function makeTicketCode() {
  // 24 bytes -> 48 hex chars (very hard to guess)
  return crypto.randomBytes(24).toString("hex");
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");

    // Minimal required fields
    const {
      event_sku,
      ticket_type,
      quantity,
      order_email,
      checkout_session_id,
      payment_intent_id,
    } = body;

    if (!event_sku || !quantity || quantity < 1) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "event_sku and quantity (>=1) are required" }),
      };
    }

    const supabase = getSupabaseAdmin();

    // Build N ticket rows
    const rows = Array.from({ length: Number(quantity) }, () => ({
      ticket_code: makeTicketCode(),
      event_sku,
      ticket_type: ticket_type || null,
      order_email: order_email || null,
      checkout_session_id: checkout_session_id || null,
      payment_intent_id: payment_intent_id || null,
      status: "issued",
    }));

    const { data, error } = await supabase
      .from("tickets")
      .insert(rows)
      .select("id,ticket_code,event_sku,ticket_type,status,created_at");

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        created: data.length,
        tickets: data,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};