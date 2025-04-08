const { createClient } = require('@supabase/supabase-js');
// Use the appropriate environment variable name for your Supabase key.
// Change SUPABASE_API_KEY to SUPABASE_KEY if that is what you're using in Netlify.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

exports.handler = async (event) => {
  // Parse the request body. Expect that it includes:
  // userId, full_name, location, primary_social_media, and social_media_username.
  const { userId, full_name, location, primary_social_media, social_media_username } = JSON.parse(event.body);

  // Update the "profiles" table using the userId as a unique identifier.
  const { data, error } = await supabase
    .from('profiles')
    .update({
      location,
      primary_social_media,
      social_media_username
    })
    .eq('id', userId);

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
};
