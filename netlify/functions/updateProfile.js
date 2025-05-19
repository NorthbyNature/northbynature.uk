// netlify/functions/updateProfile.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

exports.handler = async (event) => {
  // universal CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "https://www.northbynature.uk",  // or "*" for dev
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  }

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    }
  }

  try {
    const {
      email,
      /* full_name, */       // you removed full_name from the form
      location,
      primary_social_media,
      social_media_username,
    } = JSON.parse(event.body)

    // run your update
    const { data, error } = await supabase
      .from('profiles')
      .update({
        // full_name,         // omit if you aren’t updating it
        location,
        primary_social_media,
        social_media_username,
      })
      .eq('email', email)

    if (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Profile updated successfully', data }),
    }
  } catch (err) {
    console.error('Unhandled error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Server error' }),
    }
  }
}
