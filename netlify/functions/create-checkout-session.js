// netlify/functions/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Normalise to build consistent keys from client items
const normalise = s => String(s || '').trim().toLowerCase();

// 🔐 TRUSTED prices (amounts are in pence)
const PRICE_BOOK = {
  // format: '<event title>|<ticket type>'
  'sample event|early bird':     { name: 'Sample Event — Early Bird',     unit_amount: 100,  currency: 'gbp' }, // £1.00
  'sample event|second release': { name: 'Sample Event — Second Release', unit_amount: 3000, currency: 'gbp' }, // £30.00
  'sample event|final release':  { name: 'Sample Event — Final Release',  unit_amount: 4000, currency: 'gbp' }, // £40.00
  // add your real events/tickets here
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { cart = [] } = JSON.parse(event.body || '{}');
    if (!Array.isArray(cart) || cart.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Cart empty' }) };
    }

    const line_items = [];
    for (const item of cart) {
      const key = `${normalise(item.eventTitle)}|${normalise(item.ticketType)}`;
      const price = PRICE_BOOK[key];
      const qty = Number(item.quantity || 1);
      if (!price || qty < 1) {
        return { statusCode: 400, body: JSON.stringify({ error: `Invalid item: ${item.eventTitle} ${item.ticketType}` }) };
      }
      line_items.push({
        price_data: {
          currency: price.currency,
          product_data: { name: price.name },
          unit_amount: price.unit_amount,
        },
        quantity: qty,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_creation: 'if_required',
      billing_address_collection: 'required',
      // Redirects
      success_url: 'https://www.northbynature.uk/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:  'https://www.northbynature.uk/payment-cancelled.html',
      metadata: { source: 'nbn-site' },
    });

    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unable to create session' }) };
  }
};
