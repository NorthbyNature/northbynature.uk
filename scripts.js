// 1) Make sure this script runs after the Supabase library is loaded.
//    In your HTML:
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
//    <script src="scripts.js"></script>

// ===========================
//    INITIAL SETUP + FUNCTIONS
// ===========================
// 1️⃣ Initialize Supabase client (globally)
const supabaseClient = supabase.createClient(
  "https://jwospecasjxrknmyycno.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b3NwZWNhc2p4cmtubXl5Y25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNDcwOTUsImV4cCI6MjA0OTcyMzA5NX0.jKncofXlz0xqm0OP5gAFzDVzMnF7tBsGHcC9we0CbWs",
  { auth: { persistSession: true, autoRefreshToken: true } }
);

console.log("📑 scripts.js loaded!");
// Cart / ticket functions
function decreaseQuantity() {
  const q = document.getElementById('quantity-input');
  if (!q) return;
  let n = parseInt(q.value) || 1;
  if (n > 1) q.value = n - 1;
}
function increaseQuantity() {
  const q = document.getElementById('quantity-input');
  if (!q) return;
  q.value = (parseInt(q.value) || 0) + 1;
}
function addToCart() {
  const sel = document.querySelector('.ticket-btn.selected');
  const price = sel ? sel.getAttribute('data-price') : 0;
  const qty   = parseInt(document.getElementById('quantity-input').value) || 0;
  const title = document.querySelector('.event-title')?.innerText || '';
  const type  = sel ? sel.getAttribute('data-name') : '';
  let cart    = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push({ eventTitle: title, ticketType: type, price, quantity: qty });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert('Item added to cart!');
}
function buyNow() {
  addToCart();
  window.location.href = 'cart.html';
}
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((s, i) => s + (i.quantity || 0), 0);
  const el = document.getElementById('cart-count');
  if (el) el.innerText = count;
}

// Cart page display functions
function displayCartItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const container = document.getElementById('cart-items');
  const totalEl  = document.getElementById('cart-total');
  let html = '', total = 0;
  if (!cart.length) {
    html = '<p>Your cart is empty</p>';
    if (totalEl) totalEl.innerHTML = '';
  } else {
    cart.forEach((item, idx) => {
      const t = (item.price||0)*(item.quantity||0);
      total += t;
      html += `
        <div class="cart-item">
          <div class="cart-item-details">
            <h5>${item.eventTitle}</h5>
            <p>${item.ticketType} x ${item.quantity} = £${t.toFixed(2)}</p>
          </div>
          <div class="cart-item-quantity">
            <button onclick="decreaseCartItemQuantity(${idx})">-</button>
            <input type="text" value="${item.quantity}" readonly>
            <button onclick="increaseCartItemQuantity(${idx})">+</button>
          </div>
          <button onclick="removeItem(${idx})"><i class="fas fa-trash"></i></button>
        </div>`;
    });
    if (totalEl) totalEl.innerHTML = `Total: £${total.toFixed(2)}`;
  }
  if (container) container.innerHTML = html;
  const co = document.getElementById('checkout-button');
  if (co) co.disabled = !cart.length;
}
function decreaseCartItemQuantity(i) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart[i]?.quantity > 1) cart[i].quantity--; else cart.splice(i,1);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCartItems(); updateCartCount();
}
function increaseCartItemQuantity(i) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart[i]) cart[i].quantity++;
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCartItems(); updateCartCount();
}
function removeItem(i) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(i,1);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCartItems(); updateCartCount();
}
function redirectToPayment() {
  window.location.href = 'payment.html';
}

// PayPal button
function renderPayPalButton() {
  paypal.Buttons({
    createOrder(data, actions) {
      return fetch('/create-order',{method:'post',headers:{'content-type':'application/json'}})
        .then(r=>r.json()).then(d=>d.id);
    },
    onApprove(data, actions) {
      return fetch('/capture-order',{
        method:'post',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({ orderID: data.orderID })
      }).then(r=>r.json())
        .then(d=> {
          window.location.href = d.status==='COMPLETED'?'success.html':'failure.html';
        });
    }
  }).render('#paypal-button-container');
}

// Opportunities logic
async function updateOpportunityCount() {
  const { count, error } = await supabaseClient
    .from('opportunities')
    .select('*',{count:'exact',head:true});
  if (!error) {
    const el = document.getElementById('opp-count');
    if (el) el.textContent = `(${count})`;
  }
}
async function loadOpportunities() {
  const token = localStorage.getItem('authToken');
  if (token) await supabaseClient.auth.setSession({ access_token:token });
  const { data:opps, error:oppErr } = await supabaseClient.from('opportunities').select('*');
  if (oppErr) return console.error('Error loading opportunities:', oppErr);

  let regs = [];
  const cu = JSON.parse(localStorage.getItem('currentUser')||'{}');
  if (cu.id) {
    const { data, error } = await supabaseClient
      .from('registrations')
      .select('opportunity_id')
      .eq('user_id', cu.id);
    if (!error) regs = data.map(r=>r.opportunity_id);
  }

  const sections = {
    'Private Events':        document.getElementById('private-cards'),
    'Content Opportunities': document.getElementById('content-cards'),
    'Development':            document.getElementById('development-cards')
  };
  for (const [cat, container] of Object.entries(sections)) {
    if (!container) continue;
    const items = opps.filter(o=>o.category===cat);
    if (!items.length) {
      container.innerHTML = `<p>No available opportunities in ${cat}.</p>`;
    } else {
      container.innerHTML = items.map(op => {
        const isReg = regs.includes(op.id);
        return `
          <div class="opportunity-card">
            <img src="${op.image_url||'Images/default-placeholder.png'}" alt="${op.title}" />
            <div class="card-body">
              <h3>${op.title}</h3>
              <p>${op.description}</p>
              <p><strong>Date:</strong> ${new Date(op.date).toLocaleDateString()}</p>
              <p class="requirements">Requirements: ${op.requirements}</p>
              <button class="register-btn ${isReg?'btn-success':''}"
                      data-id="${op.id}"
                      ${isReg?'disabled':''}>
                ${isReg?'✓ Registered':'Register Interest'}
              </button>
            </div>
          </div>`;
      }).join('');
    }
  }
  document.body.addEventListener('click', e => {
    if (e.target.matches('.register-btn') && !e.target.disabled) {
      registerInterest(e.target.dataset.id);
    }
  });
}
async function registerInterest(id) {
  const token = localStorage.getItem('authToken');
  if (token) await supabaseClient.auth.setSession({ access_token:token });
  const user = JSON.parse(localStorage.getItem('currentUser')||'{}');
  if (!user.id) return window.location.href='login.html';
  const { error } = await supabaseClient
    .from('registrations')
    .insert({ user_id:user.id, opportunity_id:id });
  if (error) {
    if (error.code==='23505') return alert("Already registered.");
    return alert("Registration error: "+ error.message);
  }
  await updateOpportunityCount();
  const btn = document.querySelector(`.register-btn[data-id="${id}"]`);
  if (btn) { btn.textContent='✓ Registered'; btn.disabled=true; btn.classList.add('btn-success'); }
}

// ===========================
//  MAIN INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', async () => {
// Initialize Supabase client once
console.log("✅ DOMContentLoaded fired.");
console.log("📑 scripts.js loaded and DOM ready—now binding events");

  // Cart & tickets
  document.getElementById('add-to-cart')?.addEventListener('click', addToCart);
  document.getElementById('buy-now')?.addEventListener('click', buyNow);
  document.getElementById('decrease-quantity')?.addEventListener('click', decreaseQuantity);
  document.getElementById('increase-quantity')?.addEventListener('click', increaseQuantity);
  document.querySelectorAll('.ticket-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.ticket-btn').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
  }));

  document.querySelectorAll('.event-card').forEach(c => {
    if (c.getAttribute('data-active')!== "true") {
      c.style.setProperty("display","none","important");
    }
  });

  document.getElementById('checkout-button')?.addEventListener('click', redirectToPayment);
  if (document.body.classList.contains('cart-page')) displayCartItems();
  if (document.body.classList.contains('payment-page')) renderPayPalButton();
  updateCartCount();

  // Opportunities
  await updateOpportunityCount();
  await loadOpportunities();

  // Fade-in
  const fadeEl = document.querySelector('.fade-in');
  if (fadeEl) setTimeout(()=>fadeEl.classList.add('active'),200);

  // Sidebar toggle
  const menuToggle = document.getElementById('menuToggle');
  const menuClose  = document.getElementById('menuClose');
  const sidebar    = document.getElementById('sidebarMenu');
  const overlay    = document.getElementById('menuOverlay');
  console.log({menuToggle, menuClose, sidebar, overlay});
  if (menuToggle && menuClose && sidebar && overlay) {
    menuToggle.addEventListener('click', () => {
      console.log("🍔 Hamburger was clicked!");
      sidebar.classList.add('active');
      overlay.classList.add('active');
    });
    menuClose.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Login / logout / profile / account link
  const loginForm        = document.getElementById('login-form');
  const logoutButton     = document.getElementById('logout-button');
  const editProfileForm  = document.getElementById('edit-profile-form');
  const changePassForm   = document.getElementById('change-password-form');

  // Helpers
  const getToken        = () => localStorage.getItem('authToken');
  const getRefreshToken = () => localStorage.getItem('refreshToken');
  function updateAccountLink() {
    const a = document.getElementById('account-link');
    if (!a) return;
    a.href = localStorage.getItem('currentUser') ? 'account.html' : 'login.html';
  }

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = document.getElementById('login-error');
      if (errEl) errEl.style.display='none';
      const email = document.getElementById('username').value.trim().toLowerCase();
      const pass  = document.getElementById('password').value;
      try {
        const res = await fetch('/.netlify/functions/login',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email,password:pass})
        });
        if (!res.ok) {
          const {error} = await res.json();
          if (errEl) { errEl.textContent=error||'Login failed'; errEl.style.display='block'; }
          return;
        }
        const {user,token,refreshToken} = await res.json();
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        updateAccountLink();
        window.location.href='account.html';
      } catch {
        if (errEl) { errEl.textContent='Network error. Try again.'; errEl.style.display='block'; }
      }
    });
  }

  // LOGOUT
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.clear();
      updateAccountLink();
      window.location.href='login.html';
    });
  }

  // PROFILE UPDATE
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async e => {
      e.preventDefault();
      const loc  = document.getElementById('location-input').value.trim();
      const prim = document.getElementById('primary-social-media-input').value.trim();
      let   usern= document.getElementById('social-media-username-input').value.trim();
      if (!loc||!prim||!usern) { alert('Please fill in every field.'); return; }
      if (!usern.startsWith('@')) usern='@'+usern;
      const cu = JSON.parse(localStorage.getItem('currentUser')||'{}');
      if (!cu.email) return window.location.href='login.html';
      try {
        const res = await fetch('/.netlify/functions/updateProfile',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ email:cu.email, location:loc, primary_social_media:prim, social_media_username:usern })
        });
        if (!res.ok) {
          const {error} = await res.json();
          if (error?.includes('JWT expired')) {
            alert('Session expired. Log in again.');
            localStorage.clear();
            return window.location.href='login.html';
          }
          alert('Update error: '+error);
          return;
        }
        alert('Profile updated!');
        window.location.href='account.html';
      } catch {
        alert('Network error updating profile.');
      }
    });
  }

  // CHANGE PASSWORD
  if (changePassForm) {
    changePassForm.addEventListener('submit', async e => {
      e.preventDefault();
      const cur = document.getElementById('current-password').value.trim();
      const neu = document.getElementById('new-password').value.trim();
      const con = document.getElementById('confirm-password').value.trim();
      if (!cur||!neu||!con) return alert('All fields required.');
      if (neu!==con)           return alert('New & confirm must match.');
      const { error: sesErr } = await supabaseClient.auth.setSession({
        access_token: getToken(),
        refresh_token: getRefreshToken()
      });
      if (sesErr) {
        alert('Session expired. Log in again.');
        localStorage.clear();
        return window.location.href='login.html';
      }
      const { error: upErr } = await supabaseClient.auth.updateUser({ password:neu });
      if (upErr) {
        alert('Change failed: '+upErr.message);
        return;
      }
      alert('Password changed!');
      window.location.href='account.html';
    });
  }

  // Always refresh account link
  updateAccountLink();

  // ACCOUNT PAGE POPULATE
  const acct = document.querySelector('.account-details');
  if (acct) {
    const cu = JSON.parse(localStorage.getItem('currentUser')||'{}');
    if (!cu.email) return window.location.href='login.html';
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('full_name,membership_tier,location,primary_social_media,social_media_username,profile_picture,role')
        .eq('email', cu.email)
        .single();
      if (error) throw error;
      const name = data.full_name || cu.email;
      acct.querySelector('h1').textContent = `Welcome, ${name}`;
      acct.querySelector('#user-role').textContent = data.role||'';
      acct.querySelector('p').textContent       = `Email: ${cu.email}`;
      const tierEl = acct.querySelector('#membership-tier');
      if (data.membership_tier) {
        tierEl.textContent = `${data.membership_tier} MEMBER`;
        tierEl.classList.toggle('gold',    data.membership_tier.toLowerCase()==='gold');
        tierEl.classList.toggle('platinum',data.membership_tier.toLowerCase()==='platinum');
      }
      acct.querySelector('#location').textContent             = data.location
        ? `Primary Location: ${data.location}` : "Primary Location: Not set";
      acct.querySelector('#primary-social-media').textContent = data.primary_social_media
        ? `Primary Social Media: ${data.primary_social_media}` : "Primary Social Media: Not set";
      acct.querySelector('#social-media-username').textContent= data.social_media_username
        ? `Social Media Username: ${data.social_media_username}` : "Social Media Username: Not set";
      acct.querySelector('#profile-picture').src = data.profile_picture
        || "Images/default-placeholder.png";
    } catch (err) {
      console.error("Error fetching profile data:", err);
    }
  }
}); 

const header = document.querySelector('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const vid = document.querySelector('.video-wrapper video');
  if (vid) {
    vid.muted = true;
    vid.playsInline = true;
    vid.setAttribute('webkit-playsinline', '');
    vid.play().catch(() => { /* mobile autoplay may be blocked silently */ });
  }

 if (!vid) {
    document.body.classList.add('no-video-header');
  }
});

function playFullScreenVideo() {
  const video = document.getElementById("fullscreenVideo");
  if (!video) return;

  // First: show the video element
  video.style.display = "block";

  // Function to play video
  const playVideo = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.error("Video playback failed:", err);
      });
    }
  };

  // Then: request fullscreen
  const enterFullscreen = () => {
    if (video.requestFullscreen) {
      return video.requestFullscreen();
    } else if (video.webkitEnterFullscreen) { // iPhone Safari fallback
      return video.webkitEnterFullscreen();
    } else if (video.webkitRequestFullscreen) {
      return video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
      return video.msRequestFullscreen();
    } else {
      return Promise.resolve(); // fallback if fullscreen not supported
    }
  };

  enterFullscreen()
    .then(() => {
      playVideo();
    })
    .catch((err) => {
      console.warn("Fullscreen request failed:", err);
      playVideo(); // still try to play even if fullscreen fails
    });

  // Reset on end or fullscreen exit
  const resetVideo = () => {
    video.pause();
    video.currentTime = 0;
    video.style.display = "none";
  };

  video.onended = resetVideo;

  const onFullscreenExit = () => {
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      resetVideo();
      document.removeEventListener("fullscreenchange", onFullscreenExit);
      document.removeEventListener("webkitfullscreenchange", onFullscreenExit);
