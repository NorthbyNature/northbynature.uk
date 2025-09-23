// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const SUPABASE = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server-side only
);

if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async (event) => {
  // Stripe signature verification needs the raw body
  const sig = event.headers['stripe-signature'];
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
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

      // Pull more detail (line items, PI) for storage
      const [lineItems, paymentIntent] = await Promise.all([
        stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }),
        session.payment_intent
          ? stripe.paymentIntents.retrieve(session.payment_intent)
          : Promise.resolve(null)
      ]);

      const amount_total = session.amount_total || 0;
      const currency = session.currency || 'gbp';
      const customer_email = session.customer_details?.email || session.customer_email || null;
      const customer_name  = session.customer_details?.name || null;
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
          metadata: session.metadata || null
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;
      const orderId = orderRows.id;

      // 2) Insert line items
      const itemsPayload = (lineItems?.data || []).map(li => ({
        order_id: orderId,
        name: li.description, // Product name from Checkout line item
        ticket_type: null,    // optional: parse from name if you follow "Event — Type"
        unit_amount: li.price?.unit_amount ?? 0,
        quantity: li.quantity ?? 1,
        subtotal: li.amount_subtotal ?? ((li.price?.unit_amount || 0) * (li.quantity || 1))
      }));

      if (itemsPayload.length) {
        const { error: itemsErr } = await SUPABASE.from('order_items').insert(itemsPayload);
        if (itemsErr) throw itemsErr;
      }

      // 3) Upsert customer rollup
      if (customer_email) {
        // increment total and count
        const { data: existing, error: selErr } = await SUPABASE
          .from('customers')
          .select('email, total_spent, orders_count')
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

      // 4) (Optional) Send confirmation email via SendGrid
      if (process.env.SENDGRID_API_KEY && customer_email) {
        try {
          await sgMail.send({
            to: customer_email,
            from: { email: 'no-reply@northbynature.uk', name: 'North by Nature' },
            subject: 'Your NBN ticket order',
            html: `
              <p>Thanks for your order!</p>
              <p>Order: ${session.id}<br>
              Amount: £${(amount_total/100).toFixed(2)} ${currency.toUpperCase()}</p>
              <p>We’ll be in touch with your ticket/entry details.</p>
            `
          });
        } catch (e) {
          console.warn('SendGrid email failed:', e.message);
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
