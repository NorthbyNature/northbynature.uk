const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
  console.error("Login Error:", error.message); // Logs error for debugging
  return {
    statusCode: 400,
    body: JSON.stringify({ error: error.message }),
  };
}


  return {
    statusCode: 200,
    body: JSON.stringify({ user: data.user }),
  };
};
