// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const normalise = s => String(s || '').trim().toLowerCase();

// ✅ NEW: slugify ticket types so "Ladies 1st Release" -> "ladies-1st-release"
const slugify = s =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// 🔐 TRUSTED prices (in pence)
const PRICE_BOOK = {
  'actbad x nbn timeless: nostalgia|ladies-early-release':        { name: 'ACTBAD X NBN EASTER SPECIAL 'TIMELESS: NOSTALGIA' - Ladies Only Early Release',       unit_amount: 500,    currency: 'gbp' }, // £5.00
  'actbad x nbn timeless: nostalgia|first-release':      { name: 'ACTBAD X NBN EASTER SPECIAL 'TIMELESS: NOSTALGIA' - First Release',     unit_amount: 700,  currency: 'gbp' }, // £7.00
  'actbad x nbn timeless: nostalgia|second-release':      { name: 'ACTBAD X NBN EASTER SPECIAL 'TIMELESS: NOSTALGIA' - Second Release',     unit_amount: 1000,  currency: 'gbp' }, // £10.00
  'actbad x nbn timeless: nostalgia|final-release':  { name: 'ACTBAD X NBN EASTER SPECIAL 'TIMELESS: NOSTALGIA' - Final Release', unit_amount: 1500, currency: 'gbp' },  // £15.00

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

    // ✅ NEW: promoter code passed from scripts.js (?ref=CODE)
const promoterCode = typeof payload.promoterCode === 'string'
  ? payload.promoterCode.trim().toUpperCase()
  : '';

console.log('[create-checkout-session] promoterCode received:', promoterCode);

    if (!cart.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart empty' }) };
    }

    const line_items = cart.map(item => {
      const key = (() => {
        if (item.sku) {
          const raw = String(item.sku).trim();
          const parts = raw.split('|');
          const left = parts[0] || '';
          const right = parts[1] || '';
          return `${normalise(left)}|${slugify(right)}`;
        }
        return `${normalise(item.eventTitle)}|${slugify(item.ticketType)}`;
      })();

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
        const k = (() => {
          if (i.sku) {
            const raw = String(i.sku).trim();
            const parts = raw.split('|');
            const left = parts[0] || '';
            const right = parts[1] || '';
            return `${normalise(left)}|${slugify(right)}`;
          }
          return `${normalise(i.eventTitle)}|${slugify(i.ticketType)}`;
        })();

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

  // ✅ only set if non-empty
  client_reference_id: promoterCode ? promoterCode : undefined,

  // ✅ only include promoter_code if non-empty
  metadata: {
    source: 'nbn-site',
    skus: skusSummary,
    ...(promoterCode ? { promoter_code: promoterCode } : {})
  }
});

    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unable to create session', detail: err.message }) };
  }
};
