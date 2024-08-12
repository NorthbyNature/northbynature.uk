const express = require('express');
const nodemailer = require('nodemailer'); // Add this line to include nodemailer
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this line to parse form data

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Your existing PayPal routes
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

// New route to handle the contact form submission
app.post('/send-mail', (req, res) => {
  const { email, subject, message } = req.body;

  // Set up Nodemailer to send the email
  let transporter = nodemailer.createTransport({
    service: 'Gmail', // You may need to change this depending on your email provider
    auth: {
      user: 'your-email@gmail.com', // Replace with your email address
      pass: 'your-email-password',  // Replace with your email password
    },
  });

  let mailOptions = {
    from: email,
    to: 'your-email@gmail.com', // Replace with the recipient's email address
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
  console.log(`Server running at http://localhost:${port}/`);
});
