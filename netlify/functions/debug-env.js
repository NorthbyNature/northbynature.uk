// netlify/functions/debug-env.js
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      has_STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      has_STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET // may be false if you haven't added it yet
    })
  };
};
