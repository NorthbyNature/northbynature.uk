document.addEventListener('DOMContentLoaded', function () {
    // Add to Cart and Buy Now buttons
    const addToCartBtn = document.getElementById('add-to-cart');
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);

    const buyNowBtn = document.getElementById('buy-now');
    if (buyNowBtn) buyNowBtn.addEventListener('click', buyNow);

    // Quantity buttons
    const decreaseQuantityBtn = document.getElementById('decrease-quantity');
    const increaseQuantityBtn = document.getElementById('increase-quantity');
    if (decreaseQuantityBtn) decreaseQuantityBtn.addEventListener('click', decreaseQuantity);
    if (increaseQuantityBtn) increaseQuantityBtn.addEventListener('click', increaseQuantity);

    // Ticket selection buttons
    const ticketButtons = document.querySelectorAll('.ticket-btn');
    ticketButtons.forEach((button) => {
        button.addEventListener('click', function () {
            ticketButtons.forEach((btn) => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    // Cart page logic
    if (document.body.classList.contains('cart-page')) {
        displayCartItems();
    }

    // Payment page logic
    if (document.body.classList.contains('payment-page')) {
        renderPayPalButton();
    }

    // Update cart count for all pages
    updateCartCount();
});

// Quantity controls
function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity-input');
    let quantity = parseInt(quantityInput.value);
    if (quantity > 1) {
        quantityInput.value = quantity - 1;
    }
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity-input');
    let quantity = parseInt(quantityInput.value);
    quantityInput.value = quantity + 1;
}

// Add selected item to cart
function addToCart() {
    const selectedTicket = document.querySelector('.ticket-btn.selected');
    const price = selectedTicket ? parseFloat(selectedTicket.getAttribute('data-price')) : 0;
    const quantity = parseInt(document.getElementById('quantity-input').value);
    const eventTitle = document.querySelector('.event-title').innerText;
    const ticketType = selectedTicket ? selectedTicket.getAttribute('data-name') : '';

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find((item) => item.ticketType === ticketType && item.eventTitle === eventTitle);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ eventTitle, ticketType, price, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Item added to cart!');
}

// Buy Now functionality
function buyNow() {
    addToCart();
    window.location.href = 'cart.html';
}

// Update cart count displayed on all pages
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.innerText = cartCount;
    }
}

// Display cart items on the cart page
function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    let cartHTML = '';
    let cartTotal = 0;

    if (cart.length === 0) {
        cartHTML = '<p>Your cart is empty</p>';
        cartTotalContainer.innerHTML = '';
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            cartTotal += itemTotal;
            cartHTML += `
                <div class="cart-item">
                    <h5>${item.eventTitle}</h5>
                    <p>${item.ticketType} x ${item.quantity} = £${itemTotal.toFixed(2)}</p>
                    <div>
                        <button onclick="decreaseCartItemQuantity(${index})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="increaseCartItemQuantity(${index})">+</button>
                        <button onclick="removeItem(${index})" class="remove-item">Remove</button>
                    </div>
                </div>
            `;
        });
        cartTotalContainer.innerHTML = `Total: £${cartTotal.toFixed(2)}`;
    }

    cartItemsContainer.innerHTML = cartHTML;
    document.getElementById('checkout-button').disabled = cart.length === 0;
}

// Modify cart item quantities
function decreaseCartItemQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
    updateCartCount();
}

function increaseCartItemQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity++;
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
    updateCartCount();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
    updateCartCount();
}

// Redirect to payment
function redirectToPayment() {
    window.location.href = 'payment.html';
}

// Render PayPal button
function renderPayPalButton() {
    paypal.Buttons({
        createOrder: function (data, actions) {
            return actions.order.create({
                purchase_units: [
                    {
                        amount: {
                            value: calculateCartTotal(),
                        },
                    },
                ],
            });
        },
        onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
                alert('Transaction completed by ' + details.payer.name.given_name);
                localStorage.removeItem('cart'); // Clear cart on success
                window.location.href = 'success.html';
            });
        },
    }).render('#paypal-button-container');
}

// Calculate cart total
function calculateCartTotal() {
    const cart = JSON.parse(localStorage.get
