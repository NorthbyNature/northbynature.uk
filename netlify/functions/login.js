const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "https://www.northbynature.uk", // Update to your actual frontend URL
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  const { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Email and password are required." }),
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Login Error:", error.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid email or password." }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: { id: data.user.id, email: data.user.email },
        token: data.session.access_token, // Include the session token if needed
      }),
    };
  } catch (err) {
    console.error("Server Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error." }),
    };
  }
};