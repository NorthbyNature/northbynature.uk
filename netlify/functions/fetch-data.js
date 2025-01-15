const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const userId = event.queryStringParameters.userId; // Get userId from query params

    try {
        const { data, error } = await supabase
            .from('profiles') // Table storing user profiles
            .select('*')
            .eq('id', userId) // Filter by user ID
            .single();

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
