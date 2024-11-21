// Importing the necessary modules
const express = require('express'); // Express framework for handling HTTP requests
const dotenv = require('dotenv'); // dotenv to manage environment variables
const cors = require('cors'); // CORS for cross-origin requests
const bodyParser = require('body-parser'); // Body-parser for parsing form data

// Load environment variables from .env file
dotenv.config(); // This allows you to use variables from a .env file

const app = express(); // Initialize the express app
const port = 3000; // Define the port the server will run on

// Middleware to parse incoming JSON and URL-encoded data
app.use(bodyParser.urlencoded({ extended: true })); // Parses URL-encoded data from forms
app.use(bodyParser.json()); // Allows express to parse JSON request bodies

// CORS middleware to allow requests from your domain
app.use(cors({ origin: 'https://www.northbynature.uk' })); // Replace with your actual domain

// A basic route that sends 'Hello World!' when accessing the root URL
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Route to handle form submission
app.post('/submit-form', (req, res) => {
    const formData = req.body; // Get form data from the request body

    console.log('Form Data Received:', formData); // Log the form data for debugging

    // Process the form data (e.g., save to a database or send an email)
    // Example: Save the data to a database or perform some validation here

    // Redirect to the thank-you page after successful form submission
    res.redirect('/thank-you');
});

// PayPal SDK and configuration (assuming PayPal setup is correct)
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('./paypalConfig'); // PayPal client configuration

// Route to create a PayPal order
app.post('/create-order', async (req, res) => {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'GBP',
                value: '10.00' // Replace with dynamic order details if needed
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

// Route to capture a PayPal order
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

// Serve static files to handle thank-you page and other frontend assets
app.use(express.static('public'));

// Start the server on the specified port
app.listen(port, () => {
    console.log(`Server running at https://www.northbynature.uk/`);
});
