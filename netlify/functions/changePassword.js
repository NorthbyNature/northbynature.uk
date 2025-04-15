const { createClient } = require('@supabase/supabase-js');

// Create a default client (without auth) for fallback; we'll create one with auth below.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

exports.handler = async (event) => {
  try {
    // Extract the token from the Authorization header
    const token = event.headers.authorization
      ? event.headers.authorization.replace("Bearer ", "")
      : null;
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }
    
    // Create a new Supabase client that includes the token in its global headers.
    const supabaseWithAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_API_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Parse incoming JSON payload
    const { currentPassword, newPassword } = JSON.parse(event.body);
    if (!currentPassword || !newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Both current and new passwords are required." }),
      };
    }

    // If desired, you could perform additional checks or reauthentication here.
    // For this example, we assume the token represents a valid session.

    // Attempt to update the user's password. Supabase's updateUser method is used here.
    const { data, error } = await supabaseWithAuth.auth.updateUser({ password: newPassword });

    console.log("Password update result:", data, "Error:", error);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Password updated successfully", data }),
    };
  } catch (err) {
    console.error("Unhandled error in changePassword:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
