/**
 * Debug endpoint to test Gemini API from Cloudflare Pages Function
 * GET /api/ai/test-gemini
 */

interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  // Check if API key exists (don't log the actual key)
  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    // Force request through US datacenter to avoid geo-restriction
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "8.8.8.8",
        },
        // @ts-ignore - Cloudflare specific option
        cf: {
          resolveOverride: "generativelanguage.googleapis.com",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello",
                },
              ],
            },
          ],
        }),
      }
    );

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Fetch failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
