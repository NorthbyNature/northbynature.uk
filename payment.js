document.addEventListener('DOMContentLoaded', function() {
    renderPayPalButton();
});

// Render PayPal button
function renderPayPalButton() {
    paypal.Buttons({
        createOrder: function(data, actions) {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total
                    }
                }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                alert('Transaction completed by ' + details.payer.name.given_name);
                // Clear the cart
                localStorage.removeItem('cart');
                // Redirect to a confirmation page
                window.location.href = 'confirmation.html';
            });
        },
        funding: {
            allowed: [paypal.FUNDING.CARD, paypal.FUNDING.PAYPAL]
        },
        style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            tagline: false
        }
    }).render('#paypal-button-container');
}
