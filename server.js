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

    // Functionality for the multi-step form
    setupMultiStepForm();
});

// Multi-step form functionality
function setupMultiStepForm() {
    const fieldsets = document.querySelectorAll('form.membership-form fieldset');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const submitButton = document.querySelector('.submit-btn');
    let currentStep = 0;

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

    function updateButtonsVisibility() {
        prevButtons.forEach(button => button.style.display = currentStep > 0 ? 'inline-block' : 'none');
        nextButtons.forEach(button => button.style.display = currentStep < fieldsets.length - 1 ? 'inline-block' : 'none');
        submitButton.style.display = currentStep === fieldsets.length - 1 ? 'inline-block' : 'none';
    }

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep < fieldsets.length - 1) {
                currentStep++;
                updateFormSteps();
            }
        });
    });

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
}

// Function to decrease the quantity of an item
function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity-input');
    let quantity = parseInt(quantityInput.value);
    if (quantity > 1) {
        quantityInput.value = quantity - 1; // Decrease quantity, but not below 1
    }
}

// Function to increase the quantity of an item
function increaseQuantity() {
    const quantityInput = document.getElementById('quantity-input');
    let quantity = parseInt(quantityInput.value);
    quantityInput.value = quantity + 1; // Increase quantity by 1
}

// Function to add the selected item to the cart
function addToCart() {
    const selectedTicket = document.querySelector('.ticket-btn.selected'); // The selected ticket button
    const price = selectedTicket ? selectedTicket.getAttribute('data-price') : 0; // Get price from data attribute
    const quantity = parseInt(document.getElementById('quantity-input').value); // Get the quantity from the input
    const eventTitle = document.querySelector('.event-title').innerText; // Get event title
    const ticketType = selectedTicket ? selectedTicket.getAttribute('data-name') : ''; // Get ticket type

    let cart = JSON.parse(localStorage.getItem('cart')) || []; // Retrieve cart from local storage or create an empty array
    const item = {
        eventTitle,
        ticketType,
        price,
        quantity,
    };

    cart.push(item); // Add the new item to the cart
    localStorage.setItem('cart', JSON.stringify(cart)); // Save updated cart to local storage
    updateCartCount(); // Update the cart item count
    alert('Item added to cart!'); // Notify the user
}

// Function to handle the "Buy Now" action
function buyNow() {
    addToCart(); // Adds the item to the cart
    window.location.href = 'cart.html'; // Redirect to the cart page
}

// Function to update the cart count displayed in the header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || []; // Retrieve cart from local storage
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0); // Calculate total quantity
    document.getElementById('cart-count').innerText = cartCount; // Update cart count display
}

// Other existing cart-related functions stay unchanged
