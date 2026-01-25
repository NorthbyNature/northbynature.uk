// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const normalise = s => String(s || '').trim().toLowerCase();

// 🔐 TRUSTED prices (in pence)
const PRICE_BOOK = {
  'actbad x nbn timeless: love & toxic|ladies 1st release':        { name: 'ACTBAD X NBN VALENTINES SPECIAL TIMELESS: LOVE & TOXIC - LADIES 1ST RELEASE',       unit_amount: 500,    currency: 'gbp' }, // £5.00
  'actbad x nbn timeless: love & toxic|ladies 2nd release':      { name: 'ACTBAD X NBN VALENTINES SPECIAL TIMELESS: LOVE & TOXIC - LADIES 2ND RELEASE',     unit_amount: 700,  currency: 'gbp' }, // £7.00
  'actbad x nbn timeless: love & toxic|ladies final release':      { name: 'ACTBAD X NBN VALENTINES SPECIAL TIMELESS: LOVE & TOXIC - LADIES FINAL RELEASE',     unit_amount: 1000,  currency: 'gbp' }, // £10.00
  'actbad x nbn timeless: love & toxic|men's general release':  { name: 'ACTBAD X NBN VALENTINES SPECIAL TIMELESS: LOVE & TOXIC - MEN'S GENERAL RELEASE', unit_amount: 1500, currency: 'gbp' },  // £15.00

 // ✅ second event (example)
  'new years eve x alura|first-release':  { name: 'NEW YEARS EVE X ALURA — First Release',  unit_amount: 1000, currency: 'gbp' }, // £10
  'new years eve x alura|second-release':  { name: 'NEW YEARS EVE X ALURA — Second Release',  unit_amount: 1500, currency: 'gbp' }, // £15
  'new years eve x alura|final-release':   { name: 'NEW YEARS EVE X ALURA — Final Release',   unit_amount: 1500, currency: 'gbp' }  // £15
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const cart = Array.isArray(payload.cart) ? payload.cart : [];
    if (!cart.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart empty' }) };
    }

    const line_items = cart.map(item => {
      const key = item.sku
        ? normalise(item.sku)
        : `${normalise(item.eventTitle)}|${normalise(item.ticketType)}`;

      const price = PRICE_BOOK[key];
      const qty = Math.max(1, Number(item.quantity || 1));
      if (!price) throw new Error(`Invalid item key: ${key}`);

      return {
        price_data: {
          currency: price.currency,
          unit_amount: price.unit_amount,
          product_data: {
            name: price.name,
            // 👇 lets you search in Stripe: metadata["sku"]:"home alone house party|final-release"
            metadata: { sku: key }
          }
        },
        quantity: qty
      };
    });

    // Optional but useful: session-level summary of SKUs (for quick dashboard search/audit)
    const skusSummary = cart
      .map(i => {
        const k = i.sku
          ? normalise(i.sku)
          : `${normalise(i.eventTitle)}|${normalise(i.ticketType)}`;
        const q = Math.max(1, Number(i.quantity || 1));
        return `${k} x${q}`;
      })
      .join('; ');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      allow_promotion_codes: true,  // 👈 stays
      customer_creation: 'if_required',
      billing_address_collection: 'required',
      success_url: 'https://www.northbynature.uk/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.northbynature.uk/cart.html',
      metadata: {
        source: 'nbn-site',
        skus: skusSummary // 👈 handy summary
      }
    });

    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unable to create session', detail: err.message }) };
  }
};
