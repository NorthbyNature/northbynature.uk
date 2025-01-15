const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
  const { userId, location, social_username } = JSON.parse(event.body);

  const { data, error } = await supabase.from('users').update({ location, social_username }).eq('id', userId);

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
