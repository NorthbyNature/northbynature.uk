exports.handler = async (event) => {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_API_KEY
    );

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    }

    const { token, password } = JSON.parse(event.body);

    if (!token || !password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Token and password are required" }),
        };
    }

    try {
        const { data, error } = await supabase.auth.updateUser(token, { password });

        if (error) {
            console.error("Error updating password:", error);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Failed to update password" }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password updated successfully" }),
        };
    } catch (err) {
        console.error("Server error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Server error" }),
        };
    }
};
