// netlify/functions/updateProfile.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

exports.handler = async (event) => {
  try {
    const {
      email,
      full_name,
      location,
      primary_social_media,
      social_media_username,
    } = JSON.parse(event.body)

    console.log('Received update payload:', {
      email,
      full_name,
      location,
      primary_social_media,
      social_media_username,
    })

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        location,
        primary_social_media,
        social_media_username,
      })
      .eq('email', email)

    console.log('Update result:', { data, error })

    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Profile updated successfully', data }),
    }
  } catch (err) {
    console.error('Unhandled error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Server error' }),
    }
  }
}
