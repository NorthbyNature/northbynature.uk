// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const normalise = s => String(s || '').trim().toLowerCase();

// 🔐 TRUSTED prices (in pence)
const PRICE_BOOK = {
  'Home Alone House Party|free-ticket':    { name: 'PEDATAL LIVE: HOME ALONE HOUSE PARTY — Free Ticket',    unit_amount:  000, currency: 'gbp' }, // £0.00
  'Home Alone House Party|first-release':    { name: 'PEDATAL LIVE: HOME ALONE HOUSE PARTY — First Release',    unit_amount:  500, currency: 'gbp' }, // £5.00
  'Home Alone House Party|final-release':  { name: 'PEDATAL LIVE: HOME ALONE HOUSE PARTY — Final Release',  unit_amount: 1000, currency: 'gbp' }, // £10.00
  'Home Alone House Party|bottomless-ticket':  { name: 'PEDATAL LIVE: HOME ALONE HOUSE PARTY — Bottomless Ticket',  unit_amount: 2000, currency: 'gbp' }  // £20.00
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
          product_data: { name: price.name },
          unit_amount: price.unit_amount
        },
        quantity: qty
      };
    });

const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items,
  allow_promotion_codes: true,  // 👈 add this
  customer_creation: 'if_required',
  billing_address_collection: 'required',
  success_url: 'https://www.northbynature.uk/success.html?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://www.northbynature.uk/cart.html',
  metadata: { source: 'nbn-site' }
});

    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unable to create session', detail: err.message }) };
  }
};
