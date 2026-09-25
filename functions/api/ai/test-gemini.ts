/**
 * Debug endpoint to test Cloudflare Workers AI
 * GET /api/ai/test-gemini
 */

interface Env {
  AI: Ai;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (!env.AI) {
    return new Response(
      JSON.stringify({ error: "AI binding not configured. Add [[ai]] to wrangler.toml or enable in Cloudflare Dashboard." }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "user", content: "Xin chào, trả lời ngắn gọn bằng tiếng Việt." }
      ],
      max_tokens: 100,
    });

    return new Response(
      JSON.stringify({ success: true, response }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "AI request failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
