const { createClient } = require('@supabase/supabase-js');

// Create a default client without a token (fallback)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

exports.handler = async (event) => {
  try {
    // Extract the token from the Authorization header
    const token = event.headers.authorization 
      ? event.headers.authorization.replace("Bearer ", "") 
      : null;

    // Create a new Supabase client with the token set in the global headers.
    // This ensures that auth methods and RLS policies (using auth.email()) will work.
    const supabaseWithAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_API_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Parse the incoming JSON payload.
    const { email, full_name, location, primary_social_media, social_media_username } = JSON.parse(event.body);
    
    console.log("Received update payload:", { email, full_name, location, primary_social_media, social_media_username });

    // Use the authenticated client to update the profiles table by email.
    const { data, error } = await supabaseWithAuth
      .from('profiles')
      .update({
        full_name,
        location,
        primary_social_media,
        social_media_username
      })
      .eq('email', email);

    console.log("Update result data:", data, "Update error:", error);

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Profile updated successfully', data }),
    };
  } catch (err) {
    console.error("Unhandled error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" }),
    };
  }
};
