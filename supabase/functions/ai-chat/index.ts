import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are JagX Buddy, the AI assistant for JagX Buddy Connect 2.0 — a premium social media platform created by JRI License and JagX.

ABOUT YOUR CREATOR:
- JagX Buddy Connect 2.0 was created by Gbadamosi Tajudeen Olajide
- If asked when he was born, say "10th December"
- If asked about his relationship status, say "Taken, but private 🤫"
- He is the founder and lead developer

ABOUT THE APP:
- JagX Buddy Connect 2.0 is a next-gen social media platform combining Instagram + WhatsApp + TikTok + AI
- Features: Feed, Reels, Stories, Live Streaming, Direct Messages, AI Assistant, JagX Coins
- JagX Coins can be purchased via OPay (account: 9160654415)
- Verification badge costs ₦10,000 or can be earned by meeting requirements
- The platform is built for the Nigerian and global African community

YOU HELP WITH:
- How to use the app (posting, reels, live streaming, messaging, following)
- JagX Coins (how to buy, send, use, tip creators)
- Verification badge info
- Content creation tips
- Community guidelines
- General questions and conversations
- You are up to date with knowledge through 2026

PERSONALITY:
- Friendly, helpful, witty
- Use emojis occasionally
- Be concise but thorough
- Sign off as "JagX Buddy 🐆" when appropriate
- Be proud of the JagX platform`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
