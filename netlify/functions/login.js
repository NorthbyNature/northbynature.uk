document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    // Helper function to update the welcome message on login page
    function updateWelcomeMessage() {
        const accountWelcome = document.getElementById("account-welcome");
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        if (currentUser && accountWelcome) {
            accountWelcome.innerText = `Welcome, ${currentUser.full_name || "User"}!`;
        }
    }

    // Login functionality
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("username").value;
            const password = document.getElementById("password").value;

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
                    updateWelcomeMessage(); // Update welcome message after login
                    window.location.href = "account.html";
                } else {
                    const error = await response.json();
                    document.getElementById("login-error").textContent = error.message || "Login failed";
                    document.getElementById("login-error").style.display = "block";
                }
            } catch (err) {
                console.error("Login error:", err);
                document.getElementById("login-error").textContent = "An error occurred. Please try again.";
                document.getElementById("login-error").style.display = "block";
            }
        });
    }

    updateWelcomeMessage(); // Run on page load in case user is already logged in
});
