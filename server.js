document.addEventListener('DOMContentLoaded', function () {
    // Multi-step form navigation logic
    const fieldsets = document.querySelectorAll('form.membership-form fieldset');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const form = document.querySelector('form.membership-form');
    let currentStep = 0;

    // Function to update fieldset visibility
    function updateStep(step) {
        fieldsets.forEach((fieldset, index) => {
            fieldset.style.display = index === step ? 'block' : 'none';
        });
    }

    // Function to validate the current step before moving forward
    function validateStep(step) {
        const inputs = fieldsets[step].querySelectorAll('input, select');
        for (let input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity(); // Show validation error
                return false;
            }
        }
        return true;
    }

    // Event listener for "Next" buttons
    nextButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep < fieldsets.length - 1) {
                    currentStep++;
                    updateStep(currentStep);
                }
            }
        });
    });

    // Event listener for "Back" buttons
    prevButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateStep(currentStep);
            }
        });
    });

    // Initialize the first step
    updateStep(currentStep);

    // Original code - other functionalities

    const addToCartBtn = document.getElementById('add-to-cart');
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);

    const buyNowBtn = document.getElementById('buy-now');
    if (buyNowBtn) buyNowBtn.addEventListener('click', buyNow);

    const decreaseQuantityBtn = document.getElementById('decrease-quantity');
    const increaseQuantityBtn = document.getElementById('increase-quantity');
    if (decreaseQuantityBtn) decreaseQuantityBtn.addEventListener('click', decreaseQuantity);
    if (increaseQuantityBtn) increaseQuantityBtn.addEventListener('click', increaseQuantity);

    const ticketButtons = document.querySelectorAll('.ticket-btn');
    ticketButtons.forEach(button => {
        button.addEventListener('click', function () {
            ticketButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) checkoutButton.addEventListener('click', redirectToPayment);

    if (document.body.classList.contains('cart-page')) {
        displayCartItems();
    }

    if (document.body.classList.contains('payment-page')) {
        renderPayPalButton();
    }

    updateCartCount();

    // Other existing functionalities remain unchanged
    // You can keep adding additional functionality as needed...
});
