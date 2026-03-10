// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');
const QRCode = require('qrcode');
const crypto = require('crypto');

const SUPABASE = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-side only
);

if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function makeTicketCode() {
  return `NBN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

exports.handler = async (event) => {
  // Stripe signature verification needs the raw body
  const sig = event.headers['stripe-signature'];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : event.body;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // set in Stripe Dashboard

  let constructed;
  try {
    constructed = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    if (constructed.type === 'checkout.session.completed') {
      const session = constructed.data.object;

      // Prevent duplicate processing if Stripe retries the webhook
      const { data: existingOrder, error: existingOrderErr } = await SUPABASE
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existingOrderErr) throw existingOrderErr;

      if (existingOrder) {
        console.log('Webhook already processed for session:', session.id);
        return { statusCode: 200, body: 'already processed' };
      }

      // ✅ Promoter tracking (ref code) - stored on the session metadata/client_reference_id
      const promoterCode = (
        session?.metadata?.promoter_code ||
        session?.client_reference_id ||
        ''
      ).trim();

      // Ensure metadata always includes promoter_code (without breaking existing metadata)
      const mergedMetadata = {
        ...(session.metadata || {}),
        promoter_code: promoterCode
      };

      // Pull more detail (line items, PI) for storage
      const [lineItems, paymentIntent] = await Promise.all([
        stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }),
        session.payment_intent
          ? stripe.paymentIntents.retrieve(session.payment_intent)
          : Promise.resolve(null)
      ]);

      const amount_total = session.amount_total || 0;
      const currency = session.currency || 'gbp';
      const customer_email =
        session.customer_details?.email || session.customer_email || null;
      const customer_name = session.customer_details?.name || null;

      const billing = session.customer_details
        ? {
            name: session.customer_details.name || null,
            email: session.customer_details.email || null,
            address: session.customer_details.address || null,
            tax_ids: session.customer_details.tax_ids || null
          }
        : null;

      // 1) Insert order
      const { data: orderRows, error: orderErr } = await SUPABASE
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent || null,
          customer_email,
          customer_name,
          amount_total,
          currency,
          payment_status: session.payment_status,
          billing,
          metadata: mergedMetadata
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;
      const orderId = orderRows.id;

      // 2) Insert line items
      const itemsPayload = (lineItems?.data || []).map((li) => ({
        order_id: orderId,
        name: li.description, // Product name from Checkout line item
        ticket_type: null,    // optional: parse from name if you follow "Event — Type"
        unit_amount: li.price?.unit_amount ?? 0,
        quantity: li.quantity ?? 1,
        subtotal:
          li.amount_subtotal ??
          ((li.price?.unit_amount || 0) * (li.quantity || 1))
      }));

      if (itemsPayload.length) {
        const { error: itemsErr } = await SUPABASE
          .from('order_items')
          .insert(itemsPayload);
        if (itemsErr) throw itemsErr;
      }

      // 3) Upsert customer rollup
      if (customer_email) {
        const { data: existing, error: selErr } = await SUPABASE
          .from('customers')
          .select('email, name, total_spent, orders_count')
          .eq('email', customer_email)
          .maybeSingle();

        if (selErr) throw selErr;

        if (existing) {
          const { error: updErr } = await SUPABASE
            .from('customers')
            .update({
              name: customer_name || existing.name,
              total_spent: (existing.total_spent || 0) + amount_total,
              orders_count: (existing.orders_count || 0) + 1,
              last_order_at: new Date().toISOString()
            })
            .eq('email', customer_email);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await SUPABASE
            .from('customers')
            .insert({
              email: customer_email,
              name: customer_name,
              total_spent: amount_total,
              orders_count: 1,
              last_order_at: new Date().toISOString()
            });
          if (insErr) throw insErr;
        }
      }

      // 4) Create one ticket row + QR code per ticket purchased
      const createdTickets = [];

      for (const li of lineItems?.data || []) {
        const qty = li.quantity || 1;

        const eventSku =
          li?.price?.metadata?.event_sku ||
          li?.price?.metadata?.sku ||
          session?.metadata?.event_sku ||
          session?.metadata?.sku ||
          li?.description ||
          'UNKNOWN-EVENT';

        const ticketType =
          li?.price?.metadata?.ticket_type ||
          li?.description ||
          'General Admission';

        for (let i = 0; i < qty; i++) {
          const ticketCode = makeTicketCode();

          // Encode the ticket code itself in the QR
          const qrPayload = ticketCode;

          const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 500
          });

          const { error: ticketErr } = await SUPABASE
            .from('tickets')
            .insert({
              ticket_code: ticketCode,
              checkout_session_id: session.id,
              payment_intent_id: session.payment_intent || null,
              order_email: customer_email,
              event_sku: eventSku,
              ticket_type: ticketType,
              status: 'active'
            });

          if (ticketErr) throw ticketErr;

          createdTickets.push({
            ticketCode,
            ticketType,
            eventSku,
            qrDataUrl
          });
        }
      }

      // 5) Send confirmation email with QR code(s)
      if (process.env.SENDGRID_API_KEY && customer_email && createdTickets.length) {
        try {
          const attachments = createdTickets.map((ticket, index) => ({
            content: ticket.qrDataUrl.replace(/^data:image\/png;base64,/, ''),
            filename: `ticket-${ticket.ticketCode}.png`,
            type: 'image/png',
            disposition: 'inline',
            content_id: `qr${index}`
          }));

          const ticketsHtml = createdTickets
            .map(
              (ticket, index) => `
                <div style="margin-bottom:32px; padding:16px; border:1px solid #ddd; border-radius:8px;">
                  <p style="margin:0 0 8px;"><strong>${ticket.ticketType}</strong></p>
                  <p style="margin:0 0 8px;">Ticket code: <strong>${ticket.ticketCode}</strong></p>
                  <p style="margin:0 0 8px;">Event: <strong>${ticket.eventSku}</strong></p>
                  <img src="cid:qr${index}" alt="QR Code for ${ticket.ticketCode}" style="max-width:220px; height:auto;" />
                </div>
              `
            )
            .join('');

          await sgMail.send({
            to: customer_email,
            from: { email: 'no-reply@northbynature.uk', name: 'North by Nature' },
            subject: 'Your NBN ticket order',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <p>Thanks for your order${customer_name ? `, ${customer_name}` : ''}.</p>
                <p>
                  Order: ${session.id}<br>
                  Amount: £${(amount_total / 100).toFixed(2)} ${currency.toUpperCase()}
                </p>
                <p>Your ticket QR code${createdTickets.length > 1 ? 's are' : ' is'} below:</p>
                ${ticketsHtml}
              </div>
            `,
            attachments
          });
        } catch (e) {
          console.warn('SendGrid email failed:', e.response?.body || e.message);
          // Non-fatal; don’t fail the webhook
        }
      }
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Webhook handler error:', err);
    return { statusCode: 500, body: 'handler error' };
  }
};