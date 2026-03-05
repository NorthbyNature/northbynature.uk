exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // ✅ ADD SECRET CHECK HERE
    const secret =
      event.headers["x-door-secret"] ||
      event.headers["X-Door-Secret"] ||
      event.headers["x-door-secret".toLowerCase()];

    if (!process.env.DOOR_SCAN_SECRET || secret !== process.env.DOOR_SCAN_SECRET) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    // then continue with your existing code:
    const body = JSON.parse(event.body || "{}");
    // ... rest of function