document.addEventListener('DOMContentLoaded', function () {
    // Event listener for adding items to the cart
    const addToCartBtn = document.getElementById('add-to-cart');
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);

    // Event listener for the "Buy Now" button
    const buyNowBtn = document.getElementById('buy-now');
    if (buyNowBtn) buyNowBtn.addEventListener('click', buyNow);

    // Event listeners for increasing or decreasing quantity
    const decreaseQuantityBtn = document.getElementById('decrease-quantity');
    const increaseQuantityBtn = document.getElementById('increase-quantity');
    if (decreaseQuantityBtn) decreaseQuantityBtn.addEventListener('click', decreaseQuantity);
    if (increaseQuantityBtn) increaseQuantityBtn.addEventListener('click', increaseQuantity);

    // Event listeners for selecting ticket types
    const ticketButtons = document.querySelectorAll('.ticket-btn');
    ticketButtons.forEach(button => {
        button.addEventListener('click', function () {
            ticketButtons.forEach(btn => btn.classList.remove('selected')); // Removes the "selected" class from all buttons
            button.classList.add('selected'); // Adds the "selected" class to the clicked button
        });
    });

    // Event listener for the checkout button
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) checkoutButton.addEventListener('click', redirectToPayment);

    // If on the cart page, display cart items
    if (document.body.classList.contains('cart-page')) {
        displayCartItems();
    }

    // If on the payment page, render PayPal button
    if (document.body.classList.contains('payment-page')) {
        renderPayPalButton();
    }

    // Update cart count in the header (next to cart icon)
    updateCartCount();

    // Multi-step form functionality
    const fieldsets = document.querySelectorAll('form.membership-form fieldset');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const submitButton = document.querySelector('.submit-btn');
    let currentStep = 0;

    // Function to update form steps visibility
    function updateFormSteps() {
        fieldsets.forEach((fieldset, index) => {
            if (index === currentStep) {
                fieldset.style.display = 'block';
            } else {
                fieldset.style.display = 'none';
            }
        });
        updateButtonsVisibility();
    }

    // Function to update button visibility
    function updateButtonsVisibility() {
        prevButtons.forEach(button => button.style.display = currentStep > 0 ? 'inline-block' : 'none');
        nextButtons.forEach(button => button.style.display = currentStep < fieldsets.length - 1 ? 'inline-block' : 'none');
        submitButton.style.display = currentStep === fieldsets.length - 1 ? 'inline-block' : 'none';
    }

    // Add event listeners to Next buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < fieldsets.length - 1) {
                currentStep++;
                updateFormSteps();
            }
        });
    });

    // Add event listeners to Previous buttons
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateFormSteps();
            }
        });
    });

    // Initialize the form steps
    updateFormSteps();
});

// Other functions remain unchanged
function decreaseQuantity() { /* Existing Code */ }
function increaseQuantity() { /* Existing Code */ }
function addToCart() { /* Existing Code */ }
function buyNow() { /* Existing Code */ }
function updateCartCount() { /* Existing Code */ }
function displayCartItems() { /* Existing Code */ }
function decreaseCartItemQuantity(index) { /* Existing Code */ }
function increaseCartItemQuantity(index) { /* Existing Code */ }
function removeItem(index) { /* Existing Code */ }
function redirectToPayment() { /* Existing Code */ }
function renderPayPalButton() { /* Existing Code */ }

