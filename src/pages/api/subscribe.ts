import type { APIRoute } from "astro";

export const prerender = false;

const CONVERTKIT_API_KEY = import.meta.env.PUBLIC_CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = import.meta.env.PUBLIC_CONVERTKIT_FORM_ID;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("Content-Type") || "";
    console.log("Received Content-Type:", contentType);

    if (!contentType.includes("application/json")) {
      console.log("Content-Type check failed");
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await request.text();
    if (!body) {
      return new Response(JSON.stringify({ error: "Request body is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { email } = data;
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!CONVERTKIT_API_KEY || !CONVERTKIT_FORM_ID) {
      return new Response(JSON.stringify({ error: "Missing ConvertKit configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: CONVERTKIT_API_KEY,
          email: email,
        }),
      }
    );

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid response from ConvertKit" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ error: responseData.error || "Subscription failed" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to subscribe",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 
