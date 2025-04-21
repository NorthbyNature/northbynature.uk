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
//    Frontend: Script for Login, Logout, and Profile Management
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  // Retrieve elements (if they exist on the page)
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");
  const editProfileForm = document.getElementById("edit-profile-form");

  // Helper function to get auth token from localStorage
  function getToken() {
    return localStorage.getItem("authToken");
  }

 // Update the account page link in the header
function updateAccountLink() {
  const accountLink = document.getElementById("account-link");
  if (accountLink) {
    if (localStorage.getItem("currentUser")) {
      accountLink.href = "account.html";
    } else {
      accountLink.href = "login.html";
    }
  } else {
    console.warn("Element with ID 'account-link' not found.");
  }
}

  // ----- Login functionality (client-side) -----
if (loginForm) {
  console.log("Login form found, attaching event listener.");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Hide any previous error
    const loginErrorEl = document.getElementById("login-error");
    if (loginErrorEl) loginErrorEl.style.display = "none";

    const email = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    try {
      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { user, token } = await response.json();
        console.log("Token received:", token);

        localStorage.setItem("currentUser", JSON.stringify(user));
        localStorage.setItem("authToken", token);

        // debug: immediately verify it really wrote
        console.log("localStorage authToken now contains:", localStorage.getItem("authToken"));

        // update header link if you’re dynamically switching it
        if (typeof updateAccountLink === "function") updateAccountLink();

        window.location.href = "account.html";
      } else {
        const errData = await response.json();
        console.error("Login failed:", errData);
        if (loginErrorEl) {
          loginErrorEl.textContent = errData.error || "Login failed";
          loginErrorEl.style.display = "block";
        }
      }
    } catch (err) {
      console.error("Login error:", err);
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
      window.location.href = "login.html"; // Redirect to login page
    });
  }

// ----- Profile Update Functionality ------
if (editProfileForm) {
  editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Retrieve updated values using correct input IDs from the HTML form
    const locationValue = document.getElementById("location-input").value.trim();
    const primarySocialMediaValue = document.getElementById("primary-social-media-input").value.trim();
    let socialMediaUsernameValue = document.getElementById("social-media-username-input").value.trim();

    // Validation: Ensure all fields are filled in.
    if (!locationValue || !primarySocialMediaValue || !socialMediaUsernameValue) {
      alert("Please complete all fields before saving changes.");
      return;
    }

    // Ensure social media username begins with '@'
    if (!socialMediaUsernameValue.startsWith("@")) {
      socialMediaUsernameValue = "@" + socialMediaUsernameValue;
    }

    // Retrieve currentUser from localStorage; must include the email
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.email) {
      window.location.href = "login.html";
      return;
    }

    // Construct the payload with keys matching your Supabase table
    const payload = {
      email: currentUser.email,
      location: locationValue,
      primary_social_media: primarySocialMediaValue,
      social_media_username: socialMediaUsernameValue
    };

   console.log("Updating profile with payload:", payload);

try {
  const response = await fetch("/.netlify/functions/updateProfile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },              // ← close headers here
    body: JSON.stringify(payload)  // ← body goes here, outside of headers
  });

  // …rest of your logic…
} catch (err) {
  console.error("Error updating profile:", err);
  // …
}
      if (response.ok) {
        alert("Profile updated successfully!");
        window.location.href = "account.html";
      } else {
        const errData = await response.json();
        if (errData.error && errData.error.includes("JWT expired")) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("authToken");
          window.location.href = "login.html";
        } else {
          alert("Error updating profile: " + (errData.error || errData.message || "Unknown error"));
        }
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("An error occurred while updating the profile.");
    }
  });
}
  // Update the account link on page load
  updateAccountLink();
});

// ===========================
//    Supabase Account Page - Update DOM with Profile Data
// ===========================
document.addEventListener("DOMContentLoaded", async () => {
  // Ensure we're on the account page by checking for .account-details
  const accountDetailsElem = document.querySelector(".account-details");
  if (!accountDetailsElem) return;

  // Retrieve the user object from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // Initialize Supabase (anon key)
  const supabaseUrl = "https://jwospecasjxrknmyycno.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b3NwZWNhc2p4cmtubXl5Y25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDcwOTUsImV4cCI6MjA0OTcyMzA5NX0.jKncofXlz0xqm0OP5gAFzDVzMnF7tBsGHcC9we0CbWs";
  const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Query the profiles table by email for the desired fields
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("full_name, membership_tier, location, primary_social_media, social_media_username, profile_picture, role")
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

    // Fallback to email if full_name isn’t available
    let displayName = currentUser.email;
    if (!error && data && data.full_name) {
      displayName = data.full_name;
    }

    // Update the DOM elements with profile data
    const welcomeHeading = accountDetailsElem.querySelector("h1");
    const roleEl = accountDetailsElem.querySelector("#user-role");
    const emailDisplay = accountDetailsElem.querySelector("p"); // Assumes this <p> is for email
    const membershipTierEl = accountDetailsElem.querySelector("#membership-tier");
    const locationEl = accountDetailsElem.querySelector("#location");
    const primarysocialmediaEl = accountDetailsElem.querySelector("#primary-social-media");
    const socialmediausernameEl = accountDetailsElem.querySelector("#social-media-username");
    const profilePictureEl = accountDetailsElem.querySelector("#profile-picture");

    if (welcomeHeading) {
      welcomeHeading.textContent = `Welcome, ${displayName}`;
    }
    if (roleEl) {
      roleEl.textContent = (!error && data && data.role) ? data.role : "";
    }
    if (emailDisplay) {
      emailDisplay.textContent = `Email: ${currentUser.email}`;
    }
    if (membershipTierEl) {
      if (!error && data && data.membership_tier) {
        membershipTierEl.textContent = `${data.membership_tier} MEMBER`;
        membershipTierEl.classList.remove('gold', 'platinum');
        if (data.membership_tier.toLowerCase() === 'gold') {
          membershipTierEl.classList.add('gold');
        } else if (data.membership_tier.toLowerCase() === 'platinum') {
          membershipTierEl.classList.add('platinum');
        }
      }
    }
    if (locationEl) {
      locationEl.textContent = (!error && data && data.location)
        ? `Primary Location: ${data.location}`
        : "Primary Location: Not set";
    }
    if (primarysocialmediaEl) {
      primarysocialmediaEl.textContent = (!error && data && data.primary_social_media)
        ? `Primary Social Media: ${data.primary_social_media}`
        : "Primary Social Media: Not set";
    }
    if (socialmediausernameEl) {
      socialmediausernameEl.textContent = (!error && data && data.social_media_username)
        ? `Social Media Username: ${data.social_media_username}`
        : "Social Media Username: Not set";
    }
    if (profilePictureEl) {
      profilePictureEl.src = (!error && data && data.profile_picture)
        ? data.profile_picture
        : "Images/default-placeholder.png";
    }
  } catch (err) {
    console.error("Error fetching profile data:", err);
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const changePasswordForm = document.getElementById("change-password-form");
  if (!changePasswordForm) return;

  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get the input values
    const currentPassword = document.getElementById("current-password").value.trim();
    const newPassword = document.getElementById("new-password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();

    // Basic Validation: All fields must be filled in.
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    // Check that new password and confirm password match
    if (newPassword !== confirmPassword) {
      alert("New Password and Confirm New Password do not match.");
      return;
    }

    // (Optional) Additional client-side password strength validations can be added here

    // Retrieve currentUser from localStorage; must include a valid email (and token is stored separately)
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.email) {
      window.location.href = "login.html";
      return;
    }

    // Construct payload for the change password function
    const payload = {
      currentPassword,
      newPassword
    };

    console.log("Changing password with payload:", payload);

    try {
      const response = await fetch("/.netlify/functions/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Password changed successfully!");
        window.location.href = "account.html"; // Redirect to account page
      } else {
        const errData = await response.json();
        alert("Error changing password: " + (errData.error || errData.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error changing password:", err);
      alert("An error occurred while changing the password.");
    }
  });
});
