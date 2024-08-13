const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: 'https://www.northbynature.uk' }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// PayPal routes (assuming these are correct and in place)
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('./paypalConfig');

app.post('/create-order', async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'GBP',
        value: '10.00' // Replace with your ticket price
      }
    }]
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating order');
  }
});

app.post('/capture-order', async (req, res) => {
  const { orderID } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);

  try {
    const capture = await client.execute(request);
    res.json({ status: capture.result.status });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error capturing order');
  }
});

app.listen(port, () => {
  console.log(`Server running at https://www.northbynature.uk/`);
});
