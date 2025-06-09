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

// 1) Initialize Supabase client once
const supabaseClient = supabase.createClient(
  "https://jwospecasjxrknmyycno.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b3NwZWNhc2p4cmtubXl5Y25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDcwOTUsImV4cCI6MjA0OTcyMzA5NX0.jKncofXlz0xqm0OP5gAFzDVzMnF7tBsGHcC9we0CbWs",
{
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

document.addEventListener("DOMContentLoaded", () => {
  // Elements (if present)
  const loginForm        = document.getElementById("login-form");
  const logoutButton     = document.getElementById("logout-button");
  const editProfileForm  = document.getElementById("edit-profile-form");
  const changePassForm   = document.getElementById("change-password-form");

  // Helpers to read tokens
  function getToken()           { return localStorage.getItem("authToken"); }
  function getRefreshToken()    { return localStorage.getItem("refreshToken"); }

  // Update the account icon link
  function updateAccountLink() {
    const a = document.getElementById("account-link");
    if (!a) return;
    a.href = localStorage.getItem("currentUser")
      ? "account.html"
      : "login.html";
  }

  // ----- LOGIN -----
  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      const errEl = document.getElementById("login-error");
      if (errEl) errEl.style.display = "none";

      const email = document.getElementById("username").value.trim().toLowerCase();
      const pass  = document.getElementById("password").value;

      try {
        const res = await fetch("/.netlify/functions/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pass })
        });
        if (!res.ok) {
          const { error } = await res.json();
          if (errEl) {
            errEl.textContent = error || "Login failed";
            errEl.style.display = "block";
          }
          return;
        }
        // now capture both tokens
        const { user, token, refreshToken } = await res.json();
        localStorage.setItem("currentUser", JSON.stringify(user));
        localStorage.setItem("authToken", token);
        localStorage.setItem("refreshToken", refreshToken);

        updateAccountLink();
        window.location.href = "account.html";
      } catch {
        if (errEl) {
          errEl.textContent = "Network error. Try again.";
          errEl.style.display = "block";
        }
      }
    });
  }

  // ----- LOGOUT -----
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      updateAccountLink();
      window.location.href = "login.html";
    });
  }

  // ----- PROFILE UPDATE -----
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", async e => {
      e.preventDefault();

      const loc  = document.getElementById("location-input").value.trim();
      const prim = document.getElementById("primary-social-media-input").value.trim();
      let   usern= document.getElementById("social-media-username-input").value.trim();

      if (!loc || !prim || !usern) {
        alert("Please fill in every field.");
        return;
      }
      if (!usern.startsWith("@")) usern = "@"+usern;

      const cu = JSON.parse(localStorage.getItem("currentUser")||"{}");
      if (!cu.email) return window.location.href="login.html";

      const payload = {
        email: cu.email,
        location: loc,
        primary_social_media: prim,
        social_media_username: usern
      };

      try {
        const res = await fetch("/.netlify/functions/updateProfile", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const { error } = await res.json();
          if (error?.includes("JWT expired")) {
            alert("Session expired. Log in again.");
            localStorage.clear();
            return window.location.href="login.html";
          }
          return alert("Update error: "+error);
        }
        alert("Profile updated!");
        window.location.href="account.html";
      } catch {
        alert("Network error updating profile.");
      }
    });
  }

  // ----- CHANGE PASSWORD -----
  if (changePassForm) {
    changePassForm.addEventListener("submit", async e => {
      e.preventDefault();
      const cur = document.getElementById("current-password").value.trim();
      const neu = document.getElementById("new-password"    ).value.trim();
      const con = document.getElementById("confirm-password").value.trim();

      if (!cur||!neu||!con) {
        return alert("All fields required.");
      }
      if (neu!==con) {
        return alert("New & confirm must match.");
      }

      // 1) restore session
      const { error: sesErr } = await supabaseClient.auth.setSession({
        access_token: getToken(),
        refresh_token: getRefreshToken()
      });
      if (sesErr) {
        console.error("Session restore failed:", sesErr);
        return alert("Session expired. Please log in again.");
      }

      // 2) perform update
      const { error: upErr } = await supabaseClient.auth.updateUser({
        password: neu
      });
      if (upErr) {
        console.error("Password change error:", upErr);
        return alert("Change failed: "+upErr.message);
      }

      alert("Password changed!");
      window.location.href="account.html";
    });
  }

  // Always refresh the header link on page load
  updateAccountLink();
});

// ===========================
//    ACCOUNT PAGE DOM POPULATE
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  const acct = document.querySelector(".account-details");
  if (!acct) return;
  const cu = JSON.parse(localStorage.getItem("currentUser")||"{}");
  if (!cu.email) return window.location.href="login.html";

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("full_name,membership_tier,location,primary_social_media,social_media_username,profile_picture,role")
      .eq("email", cu.email)
      .single();
    if (error) throw error;

    // populate UI...
    const name = data.full_name || cu.email;
    acct.querySelector("h1").textContent = `Welcome, ${name}`;
    acct.querySelector("#user-role").textContent = data.role||"";
    acct.querySelector("p").textContent       = `Email: ${cu.email}`;

    const tierEl = acct.querySelector("#membership-tier");
    if (data.membership_tier) {
      tierEl.textContent = `${data.membership_tier} MEMBER`;
      tierEl.classList.toggle("gold",    data.membership_tier.toLowerCase()==="gold");
      tierEl.classList.toggle("platinum",data.membership_tier.toLowerCase()==="platinum");
    }

    acct.querySelector("#location").textContent             = data.location
      ? `Primary Location: ${data.location}` : "Primary Location: Not set";
    acct.querySelector("#primary-social-media").textContent = data.primary_social_media
      ? `Primary Social Media: ${data.primary_social_media}` : "Primary Social Media: Not set";
    acct.querySelector("#social-media-username").textContent= data.social_media_username
      ? `Social Media Username: ${data.social_media_username}` : "Social Media Username: Not set";
    acct.querySelector("#profile-picture").src = data.profile_picture
      || "Images/default-placeholder.png";

  } catch (err) {
    console.error("Error fetching profile data:", err);
  }
});
//  OPPORTUNITIES LOGIC
// --------------------

// 1️⃣ Update the little “badge” on your account page
async function updateOpportunityCount() {
  const { count, error } = await supabaseClient
    .from('opportunities')
    .select('*', { count: 'exact', head: true });

  if (!error) {
    const el = document.getElementById('opp-count');
    if (el) el.textContent = `(${count})`;
  } else {
    console.error('Failed to load opportunity count:', error);
  }
}

// 2️⃣ Load & render all opportunities on opportunities.html
async function loadOpportunities() {
  // 2a) restore session for RLS
  const token = localStorage.getItem('authToken');
  if (token) {
    const { error: sessErr } = await supabaseClient.auth.setSession({ access_token: token });
    if (sessErr) console.error('Session restore failed:', sessErr);
  }

  // 2b) fetch opportunities
  const { data: opps, error: oppErr } = await supabaseClient
    .from('opportunities')
    .select('*');
  if (oppErr) {
    console.error('Error loading opportunities:', oppErr);
    return;
  }

  // 2c) fetch this user's registrations (to persist green state)
  let registeredIds = [];
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (currentUser.id) {
    const { data: regs, error: regErr } = await supabaseClient
      .from('registrations')
      .select('opportunity_id')
      .eq('user_id', currentUser.id);
    if (regErr) {
      console.error('Error loading registrations:', regErr);
    } else {
      registeredIds = regs.map(r => r.opportunity_id);
    }
  }

  // 2d) render into each category container
  const sections = {
    'Private Events':        document.getElementById('private-cards'),
    'Content Opportunities': document.getElementById('content-cards'),
    'Development':            document.getElementById('development-cards'),
  };

  for (const [category, container] of Object.entries(sections)) {
    if (!container) continue;
    const items = opps.filter(o => o.category === category);

    if (items.length === 0) {
      container.innerHTML = `<p>There are no available opportunities for this at this moment.</p>`;
    } else {
      container.innerHTML = items.map(op => {
        const isRegistered = registeredIds.includes(op.id);
        return `
          <div class="opportunity-card">
            <div class="card-header"></div>
            <img src="${op.image_url || 'Images/default-placeholder.png'}" alt="${op.title}" />
            <div class="card-body">
              <h3>${op.title}</h3>
              <p>${op.description}</p>
              <p><strong>Date:</strong> ${new Date(op.date).toLocaleDateString()}</p>
              <p class="requirements">Requirements: ${op.requirements}</p>
              <button
                class="register-btn ${isRegistered ? 'btn-success' : ''}"
                data-id="${op.id}"
                ${isRegistered ? 'disabled' : ''}
              >
                ${isRegistered ? '✓ Registered' : 'Register Interest'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// 3️⃣ Insert into registrations table (and flip the button green)
async function registerInterest(opportunityId) {
  // 3a) restore session for RLS
  const token = localStorage.getItem('authToken');
  if (token) {
    const { error: sessErr } = await supabaseClient.auth.setSession({ access_token: token });
    if (sessErr) {
      console.error('Session restore failed:', sessErr);
      alert('Session expired. Please log in again.');
      return window.location.href = 'login.html';
    }
  }

  // 3b) get user
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!user.id) {
    alert('Please log in first.');
    return window.location.href = 'login.html';
  }

  // 3c) insert
  const { error } = await supabaseClient
    .from('registrations')
    .insert({ user_id: user.id, opportunity_id: opportunityId });

  if (error) {
    // unique constraint?
    if (error.code === '23505') {
      return alert("You’ve already registered interest in this opportunity.");
    }
    console.error('Registration failed:', error);
    return alert('Could not register interest: ' + error.message);
  }

  // 3d) success: update badge + button state
  updateOpportunityCount();

  const btn = document.querySelector(`button.register-btn[data-id="${opportunityId}"]`);
  if (btn) {
    btn.textContent = '✓ Registered';
    btn.disabled = true;
    btn.classList.add('btn-success');
  }

  // optional: a little pop animation
  btn && btn.classList.add('btn-pop');
}

// 4️⃣ Wire them up on page load
document.addEventListener('DOMContentLoaded', () => {
  updateOpportunityCount();
  loadOpportunities();

  document.body.addEventListener('click', e => {
    if (e.target.matches('.register-btn') && !e.target.disabled) {
      registerInterest(e.target.dataset.id);
    }
  });
document.addEventListener("DOMContentLoaded", function () { 
// ✅ Sidebar toggle logic
  const menuToggle = document.getElementById("menuToggle");
  const menuClose = document.getElementById("menuClose");
  const sidebar = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("menuOverlay");

  if (menuToggle && menuClose && sidebar && overlay) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
    });

    menuClose.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  } else {
    console.warn('One or more sidebar menu elements not found.');
  }
});