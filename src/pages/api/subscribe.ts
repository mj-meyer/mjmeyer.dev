import type { APIRoute } from "astro";

export const prerender = false;

const CONVERTKIT_API_KEY = import.meta.env.PUBLIC_CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = import.meta.env.PUBLIC_CONVERTKIT_FORM_ID;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, firstName } = await request.json();

    if (!email || !firstName) {
      return new Response(
        JSON.stringify({ error: "Email and first name are required" }),
        { status: 400 }
      );
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
          email,
          first_name: firstName,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Subscription failed');
    }

    return new Response(
      JSON.stringify({ message: "Successfully subscribed!" }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(
      JSON.stringify({ error: "Failed to subscribe" }),
      { status: 500 }
    );
  }
}; 
