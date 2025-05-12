const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "https://www.northbynature.uk",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Parse the request body
  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  // If an action is provided and it's "logout", handle logout
  if (bodyData.action && bodyData.action.toLowerCase() === "logout") {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout Error:", error.message);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "Logout failed" }),
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Logout successful" }),
      };
    } catch (err) {
      console.error("Server Error during logout:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Internal Server Error during logout" }),
      };
    }
  }

  // Default to login action
  const { email, password } = bodyData;

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
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid email or password." }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: { id: data.user.id, email: data.user.email },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    };
  } catch (err) {
    console.error("Server Error during login:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error." }),
    };
  }
};
