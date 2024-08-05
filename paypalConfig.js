const paypal = require('@paypal/checkout-server-sdk');

let environment = new paypal.core.SandboxEnvironment('sb-2ifr329063585@business.example.com', 'EU=>0|Eg');
let client = new paypal.core.PayPalHttpClient(environment);

module.exports = { client };
