document.addEventListener('DOMContentLoaded', function () {
    // Event listener for adding items to cart
    const addToCartBtn = document.getElementById('add-to-cart');
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);

    const buyNowBtn = document.getElementById('buy-now');
    if (buyNowBtn) buyNowBtn.addEventListener('click', buyNow);

    // Event listeners for quantity buttons
    const decreaseQuantityBtn = document.getElementById('decrease-quantity');
    const increaseQuantityBtn = document.getElementById('increase-quantity');
    if (decreaseQuantityBtn) decreaseQuantityBtn.addEventListener('click', decreaseQuantity);
    if (increaseQuantityBtn) increaseQuantityBtn.addEventListener('click', increaseQuantity);

    // Event listeners for ticket buttons
    const ticketButtons = document.querySelectorAll('.ticket-btn');
    ticketButtons.forEach(button => {
        button.addEventListener('click', function () {
            ticketButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    // Event listener for checkout button
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) checkoutButton.addEventListener('click', redirectToPayment);

    // Check if we are on the cart page
    if (document.body.classList.contains('cart-page')) {
        displayCartItems();
    }

    // Check if we are on the payment page
    if (document.body.classList.contains('payment-page')) {
        renderPayPalButton();
    }

    updateCartCount();
});

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

// Add item to cart
function addToCart() {
    const selectedTicket = document.querySelector('.ticket-btn.selected');
    const price = selectedTicket ? selectedTicket.getAttribute('data-price') : 0;
    const quantity = parseInt(document.getElementById('quantity-input').value);
    const eventTitle = document.querySelector('.event-title').innerText;
    const ticketType = selectedTicket ? selectedTicket.getAttribute('data-name') : '';

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = {
        eventTitle,
        ticketType,
        price,
        quantity,
    };

    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Item added to cart!');
}

function buyNow() {
    addToCart();
    window.location.href = 'cart.html';
}

// Update cart item count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
    document.getElementById('cart-count').innerText = cartCount;
}

// Display cart items
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
                    <div class="cart-item-details">
                        <h5>${item.eventTitle}</h5>
                        <p>${item.ticketType} x ${item.quantity} = £${itemTotal.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="decrease-quantity" onclick="decreaseCartItemQuantity(${index})">-</button>
                        <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                        <button class="increase-quantity" onclick="increaseCartItemQuantity(${index})">+</button>
                    </div>
                    <button class="remove-item" onclick="removeItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        cartTotalContainer.innerHTML = `Total: £${cartTotal.toFixed(2)}`;
    }

    cartItemsContainer.innerHTML = cartHTML;
    document.getElementById('checkout-button').disabled = cart.length === 0;
}

// Decrease item quantity in cart
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

// Increase item quantity in cart
function increaseCartItemQuantity(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity++;
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
    updateCartCount();
}

// Remove item from cart
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
    updateCartCount();
}

// Redirect to payment page
function redirectToPayment() {
    window.location.href = 'payment.html';
}

// Render PayPal button
function renderPayPalButton() {
    paypal.Buttons({
        createOrder: function (data, actions) {
            return fetch('/create-order', {
                method: 'post',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    // Customize this object to pass additional details if needed
                }),
            })
                .then(function (res) {
                    console.log('Create order response:', res); // Log response
                    return res.json();
                })
                .then(function (orderData) {
                    console.log('Order data:', orderData); // Log order data
                    return orderData.id;
                })
                .catch(function (err) {
                    console.error('Create order error:', err); // Log error
                });
        },
        onApprove: function (data, actions) {
            return fetch('/capture-order', {
                method: 'post',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    orderID: data.orderID,
                }),
            })
                .then(function (res) {
                    console.log('Capture order response:', res); // Log response
                    return res.json();
                })
                .then(function (orderData) {
                    console.log('Order data:', orderData); // Log order data
                    if (orderData.status === 'COMPLETED') {
                        window.location.href = 'success.html';
                    } else {
                        window.location.href = 'failure.html';
                    }
                })
                .catch(function (err) {
                    console.error('Capture order error:', err); // Log error
                });
        },
    }).render('#paypal-button-container');
}
