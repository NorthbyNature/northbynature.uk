const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Route to handle the contact form submission
app.post('/send-mail', (req, res) => {
  const { email, subject, message } = req.body;

  // Set up Nodemailer to send the email
  let transporter = nodemailer.createTransport({
    service: 'Gmail', // Adjust this if needed
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: email,
    to: process.env.EMAIL_TO, // Use the recipient's email from the environment variable
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Error sending email');
    }
    console.log('Email sent:', info.response);
    res.send('Message sent successfully!');
  });
});

app.listen(port, () => {
  console.log(`Server running at https://www.northbynature.uk/`);
});
