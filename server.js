// Importing the necessary modules
const express = require('express'); // Express framework for handling HTTP requests
const dotenv = require('dotenv'); // dotenv to manage environment variables

// Load environment variables from .env file
dotenv.config(); // This allows you to use variables from a .env file

const app = express(); // Initialize the express app
const port = 3000; // Define the port the server will run on

// Middleware to parse incoming JSON and URL-encoded data
app.use(express.json()); // Allows express to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data from forms

// CORS middleware to allow requests from your domain
// Modify the 'origin' value if you want to allow access from another domain
app.use(cors({ origin: 'https://www.northbynature.uk' }));

// A basic route that sends 'Hello World!' when accessing the root URL
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// PayPal SDK and configuration (assuming PayPal setup is correct)
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('./paypalConfig'); // PayPal client configuration

// Route to create a PayPal order
app.post('/create-order', async (req, res) => {
  // Set up the PayPal order creation request
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation"); // Request the full order details in the response

  // Define the order details (replace with your dynamic order details if needed)
  request.requestBody({
    intent: 'CAPTURE', // PayPal intent for capturing payment immediately
    purchase_units: [{
      amount: {
        currency_code: 'GBP', // Set currency (e.g., GBP for British Pounds)
        value: '10.00' // Set the ticket price (you can make this dynamic)
      }
    }]
  });

  try {
    // Execute the request to create the PayPal order
    const order = await client.execute(request);
    res.json({ id: order.result.id }); // Respond with the PayPal order ID
  } catch (err) {
    // Handle errors in the order creation process
    console.error(err);
    res.status(500).send('Error creating order');
  }
});

// Route to capture a PayPal order
app.post('/capture-order', async (req, res) => {
  const { orderID } = req.body; // Get the PayPal order ID from the request body
  const request = new paypal.orders.OrdersCaptureRequest(orderID); // Prepare the capture request

  try {
    // Execute the capture request to capture the payment
    const capture = await client.execute(request);
    res.json({ status: capture.result.status }); // Respond with the capture status (e.g., COMPLETED)
  } catch (err) {
    // Handle errors in the capture process
    console.error(err);
    res.status(500).send('Error capturing order');
  }
});

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Server running at https://www.northbynature.uk/`); // Log the URL when the server is running
});
