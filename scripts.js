// 1) Make sure this script runs after the Supabase library is loaded.
// For example, add in your HTML: 
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
// <script src="scripts.js"></script>

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
            cartHTML += 
                 `<div class="cart-item">
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
                </div>`;
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

document.addEventListener("DOMContentLoaded", function () {
    const fadeInElement = document.querySelector(".fade-in");
    if (fadeInElement) {
        setTimeout(() => {
            fadeInElement.classList.add("active");
        }, 200); // Slight delay for smoothness (200ms)
    }
});

// Frontend: Script for Login, Logout, and Profile Management
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const logoutButton = document.getElementById("logout-button");
    const editProfileForm = document.getElementById("edit-profile-form");

    // Get auth token from local storage
    function getToken() {
        return localStorage.getItem("authToken");
    }

    // Update the account page link
    function updateAccountLink() {
        const accountLink = document.getElementById("account-link");
        if (localStorage.getItem("currentUser")) {
            accountLink.href = "account.html";
        } else {
            accountLink.href = "login.html";
        }
    }

    // ✅ Login functionality (client-side)
    if (loginForm) {
        console.log("Login form found, attaching event listener.");
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("username").value.trim().toLowerCase();
            const password = document.getElementById("password").value.trim();

            console.log("Login submitted with email:", email);

            try {
                const response = await fetch("/.netlify/functions/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const { user, token } = await response.json();
                    localStorage.setItem("currentUser", JSON.stringify(user));
                    localStorage.setItem("authToken", token);
                    console.log("Login successful, redirecting to account.html");
                    window.location.href = "account.html"; // Redirect to account page
                } else {
                    const error = await response.json();
                    console.error("Login failed:", error);
                    document.getElementById("login-error").textContent = error.error || "Login failed";
                    document.getElementById("login-error").style.display = "block";
                }
            } catch (err) {
                console.error("Login error:", err);
                document.getElementById("login-error").textContent = "An error occurred. Please try again.";
                document.getElementById("login-error").style.display = "block";
            }
        });
    }

    // ✅ Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("authToken");
            window.location.href = "login.html"; // Redirect to login page
        });
    }

    // ✅ Profile Update
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const location = document.getElementById("location").value;
            const primarySocialMedia = document.getElementById("primary-social-media").value;

            try {
                const response = await fetch("/.netlify/functions/updateProfile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({ location, primarySocialMedia }),
                });

                if (response.ok) {
                    alert("Profile successfully updated!");
                } else {
                    alert("Error updating profile.");
                }
            } catch (err) {
                console.error("Profile update error:", err);
                alert("An error occurred while updating the profile.");
            }
        });
    }

    // ✅ Run updateAccountLink on page load
    updateAccountLink();
});

/// ===========================
//    Supabase Account Page
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  // 2) Make sure we're on the account page
  const accountDetailsElem = document.querySelector(".account-details");
  if (!accountDetailsElem) return; // Not on the account page

  // 3) Retrieve the user object from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // 4) Initialize Supabase (anon key)
  const supabaseUrl = "https://jwospecasjxrknmyycno.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b3NwZWNhc2p4cmtubXl5Y25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDcwOTUsImV4cCI6MjA0OTcyMzA5NX0.jKncofXlz0xqm0OP5gAFzDVzMnF7tBsGHcC9we0CbWs";
  const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 5) Query the profiles table by email for full_name and membership_tier
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("full_name, membership_tier")
      .eq("email", currentUser.email)
      .single();

    console.log("Query error:", error);
    console.log("Profile data:", data);

    if (error) {
      console.error("Error fetching profile data:", error);
      const welcomeHeading = accountDetailsElem.querySelector("h1");
      if (welcomeHeading) {
        welcomeHeading.textContent = "Welcome, [Error loading name]";
      }
    }

    // 6) Fallback to email if no full_name is found
    let displayName = currentUser.email;
    if (!error && data && data.full_name) {
      displayName = data.full_name;
    }

    // 7) Update the DOM for welcome message, email, and membership tier
    const welcomeHeading = accountDetailsElem.querySelector("h1");
    const emailDisplay = accountDetailsElem.querySelector("p"); // Assumes this <p> is for email
    const membershipTierEl = accountDetailsElem.querySelector("#membership-tier");

    if (welcomeHeading) {
      welcomeHeading.textContent = `Welcome, ${displayName}`;
    }
    if (emailDisplay) {
      emailDisplay.textContent = `Email: ${currentUser.email}`;
    }
    if (membershipTierEl) {
      if (!error && data && data.membership_tier) {
        membershipTierEl.textContent = `Membership Tier: ${data.membership_tier}`;
      } else {
        membershipTierEl.textContent = "Membership Tier: Unknown";
      }
    }
  } catch (err) {
    console.error("Error fetching profile data:", err);
  }
});

