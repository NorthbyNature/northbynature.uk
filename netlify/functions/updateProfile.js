const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

exports.handler = async (event) => {
  try {
    // Parse the incoming JSON
    const { email, full_name, location, primary_social_media, social_media_username } = JSON.parse(event.body);
    
    // Log the received payload for debugging
    console.log("Received update payload:", { email, full_name, location, primary_social_media, social_media_username });

    // Update the 'profiles' table based on the user's email
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        location,
        primary_social_media,
        social_media_username
      })
      .eq('email', email);

    // Log the update query result
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
