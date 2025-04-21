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
  // Select all event cards
  const eventCards = document.querySelectorAll('.event-card');
  console.log("Event cards found:", eventCards.length);

  eventCards.forEach(card => {
    // Log the current value of data-active for debugging
    const isActive = card.getAttribute('data-active');
    console.log("Card data-active value:", isActive);
    // Hide the card if data-active is not "true"
    if (isActive !== "true") {
      card.style.setProperty("display", "none", "important"); // Force hiding if needed
      console.log("Hiding card");
    }
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

// ===========================
//    Frontend: Script for Login, Logout, Profile Update & Account‑Link
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  // Retrieve elements (if they exist on the page)
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");
  const editProfileForm = document.getElementById("edit-profile-form");

  // Helper to get auth token
  function getToken() {
    return localStorage.getItem("authToken");
  }

  // Update the account page link in the header
  function updateAccountLink() {
    const accountLink = document.getElementById("account-link");
    if (accountLink) {
      accountLink.href = localStorage.getItem("currentUser")
        ? "account.html"
        : "login.html";
    }
  }

  // ----- Login functionality -----
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const loginErrorEl = document.getElementById("login-error");
      if (loginErrorEl) loginErrorEl.style.display = "none";

      const email = document.getElementById("username").value.trim().toLowerCase();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch("/.netlify/functions/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const err = await res.json();
          if (loginErrorEl) {
            loginErrorEl.textContent = err.error || "Login failed";
            loginErrorEl.style.display = "block";
          }
          return;
        }

        const { user, token } = await res.json();
        localStorage.setItem("currentUser", JSON.stringify(user));
        localStorage.setItem("authToken", token);
        updateAccountLink();
        window.location.href = "account.html";
      } catch {
        if (loginErrorEl) {
          loginErrorEl.textContent = "An error occurred. Please try again.";
          loginErrorEl.style.display = "block";
        }
      }
    });
  }

  // ----- Logout functionality -----
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      updateAccountLink();
      window.location.href = "login.html";
    });
  }

  // ----- Profile Update functionality -----
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Gather & validate
      const loc = document.getElementById("location-input").value.trim();
      const prim = document.getElementById("primary-social-media-input").value.trim();
      let usern = document.getElementById("social-media-username-input").value.trim();

      if (!loc || !prim || !usern) {
        alert("Please complete all fields before saving changes.");
        return;
      }
      if (!usern.startsWith("@")) usern = "@" + usern;

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser?.email) {
        window.location.href = "login.html";
        return;
      }

      const payload = {
        email: currentUser.email,
        location: loc,
        primary_social_media: prim,
        social_media_username: usern,
      };

      try {
        const res = await fetch("/.netlify/functions/updateProfile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          if (err.error?.includes("JWT expired")) {
            alert("Session expired. Please log in again.");
            localStorage.clear();
            window.location.href = "login.html";
          } else {
            alert("Error updating profile: " + (err.error || err.message || ""));
          }
          return;
        }

        alert("Profile updated successfully!");
        window.location.href = "account.html";
      } catch {
        alert("An error occurred while updating the profile.");
      }
    });
  }

  // Always refresh the header link
  updateAccountLink();
});

// ===========================
//    Supabase Account Page — DOM Update
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  const accountDetailsElem = document.querySelector(".account-details");
  if (!accountDetailsElem) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser?.email) {
    window.location.href = "login.html";
    return;
  }

  const supabaseClient = supabase.createClient(
    "https://jwospecasjxrknmyycno.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b3NwZWNhc2p4cmtubXl5Y25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDcwOTUsImV4cCI6MjA0OTcyMzA5NX0.jKncofXlz0xqm0OP5gAFzDVzMnF7tBsGHcC9we0CbWs"
  );

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("full_name, membership_tier, location, primary_social_media, social_media_username, profile_picture, role")
      .eq("email", currentUser.email)
      .single();

    if (error) throw error;

    const displayName = data.full_name || currentUser.email;
    accountDetailsElem.querySelector("h1").textContent = `Welcome, ${displayName}`;
    accountDetailsElem.querySelector("#user-role").textContent = data.role || "";
    accountDetailsElem.querySelector("p").textContent = `Email: ${currentUser.email}`;

    const tierEl = accountDetailsElem.querySelector("#membership-tier");
    if (data.membership_tier) {
      tierEl.textContent = `${data.membership_tier} MEMBER`;
      tierEl.classList.toggle("gold", data.membership_tier.toLowerCase()==="gold");
      tierEl.classList.toggle("platinum", data.membership_tier.toLowerCase()==="platinum");
    }

    accountDetailsElem.querySelector("#location").textContent =
      data.location ? `Primary Location: ${data.location}` : "Primary Location: Not set";
    accountDetailsElem.querySelector("#primary-social-media").textContent =
      data.primary_social_media ? `Primary Social Media: ${data.primary_social_media}` : "Primary Social Media: Not set";
    accountDetailsElem.querySelector("#social-media-username").textContent =
      data.social_media_username ? `Social Media Username: ${data.social_media_username}` : "Social Media Username: Not set";
    accountDetailsElem.querySelector("#profile-picture").src =
      data.profile_picture || "Images/default-placeholder.png";
  } catch (err) {
    console.error("Error fetching profile data:", err);
  }
});
