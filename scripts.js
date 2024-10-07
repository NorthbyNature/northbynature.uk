document.addEventListener('DOMContentLoaded', function() {
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
        button.addEventListener('click', function() {
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
});

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

// Function to display cart items on the cart page
function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || []; // Retrieve cart from local storage
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    let cartHTML = '';
    let cartTotal = 0;

    if (cart.length === 0) {
        cartHTML = '<p>Your cart is empty</p>'; // Display empty cart message
        cartTotalContainer.innerHTML = '';
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity; // Calculate total price for each item
            cartTotal += itemTotal; // Add to total cart price
            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <h5>${item.eventTitle}</h5>
                        <p>${item.ticketType} x ${item.quantity} = £${itemTotal.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button onclick="decreaseCartItemQuantity(${index})">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button onclick="increaseCartItemQuantity(${index})">+</button>
                    </div>
                    <button class="remove-item" onclick="removeItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        cartTotalContainer.innerHTML = `Total: £${cartTotal.toFixed(2)}`; // Update total price display
    }

    cartItemsContainer.innerHTML = cartHTML; // Display cart items
    document.getElementById('checkout-button').disabled = cart.length === 0; // Disable checkout button if cart is empty
}

// Function to decrease the quantity of a cart item
function decreaseCartItemQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index].quantity > 1) {
        cart[index].quantity--; // Decrease quantity if greater than 1
    } else {
        cart.splice(index, 1); // Remove item if quantity is 1
    }
    localStorage.setItem('cart', JSON.stringify(cart)); // Save updated cart to local storage
    displayCartItems(); // Update the cart display
    updateCartCount(); // Update the cart count
}

// Function to increase the quantity of a cart item
function increaseCartItemQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity++; // Increase the quantity
    localStorage.setItem('cart', JSON.stringify(cart)); // Save updated cart to local storage
    displayCartItems(); // Update the cart display
    updateCartCount(); // Update the cart count
}

// Function to remove an item from the cart
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1); // Remove the item at the given index
    localStorage.setItem('cart', JSON.stringify(cart)); // Save updated cart to local storage
    displayCartItems(); // Update the cart display
    updateCartCount(); // Update the cart count
}

// Function to redirect to the payment page
function redirectToPayment() {
    window.location.href = 'payment.html'; // Redirect to the payment page
}

// Function to render the PayPal button on the payment page
function renderPayPalButton() {
    paypal.Buttons({
        createOrder: function(data, actions) {
            return fetch('/create-order', {
                method: 'post',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    // Customize this object to pass additional details if needed
                })
            }).then(function(res) {
                return res.json();
            }).then(function(orderData) {
                return orderData.id; // Return the order ID
            }).catch(function(err) {
                console.error('Create order error:', err); // Log error
            });
        },
        onApprove: function(data, actions) {
            return fetch('/capture-order', {
                method: 'post',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    orderID: data.orderID
                })
            }).then(function(res) {
                return res.json();
            }).then(function(orderData) {
                if (orderData.status === 'COMPLETED') {
                    window.location.href = 'success.html'; // Redirect to success page
                } else {
                    window.location.href = 'failure.html'; // Redirect to failure page
                }
            }).catch(function(err) {
                console.error('Capture order error:', err); // Log error
            });
        }
    }).render('#paypal-button-container'); // Render PayPal button inside this container
}

document.addEventListener('DOMContentLoaded', function() {
    // Event listener to hide event cards if marked as inactive
    const eventCard = document.querySelector('.event-card');

    if (eventCard && eventCard.getAttribute('data-active') === 'false') {
        eventCard.style.display = 'none'; // Hide the card if it is inactive
    }
});
