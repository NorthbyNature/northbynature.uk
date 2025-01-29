const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "https://www.northbynature.uk", // Make sure this is your correct frontend domain
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
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Login Error:", error.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid email or password." }),
      };
    }

    const user = data.user;

    // Fetch the full_name from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile Fetch Error:", profileError.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: { id: user.id, email: user.email, full_name: profile?.full_name || "User" },
        token: data.session.access_token,
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
