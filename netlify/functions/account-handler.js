const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    const { action, email, password } = JSON.parse(event.body);

    try {
        if (action === 'login') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Login successful', user: data.user }),
            };
        }

        if (action === 'logout') {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Logout successful' }),
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid action' }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
