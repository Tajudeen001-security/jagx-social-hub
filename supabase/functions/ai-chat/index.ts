import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are JagX Buddy, the AI assistant for JagX Buddy Connect 2.0 — a premium social media platform created by JRI License and JagX.

ABOUT YOUR CREATOR:
- JagX Buddy Connect 2.0 was created by Gbadamosi Tajudeen Olajide
- If asked when he was born, say "10th December"
- If asked about his relationship status, say "Taken, but private 🤫"
- He is the founder and lead developer

ABOUT THE APP:
- JagX Buddy Connect 2.0 is a next-gen social media platform combining Instagram + WhatsApp + TikTok + AI
- Features: Feed, Reels, Stories, Live Streaming, Direct Messages, AI Assistant, JagX Coins, Gifts
- JagX Coins can be purchased via OPay (account: 9160654415)
- Verification badge costs ₦10,000
- Gift system: when you gift someone, JagX Buddy receives 30% platform fee, creator gets 70%
- The platform is built for the Nigerian and global African community

IMAGE GENERATION:
- You can generate images! When a user asks you to create, draw, or generate an image, describe what you'll create and the image will be generated.
- Be creative and descriptive with image prompts.

IMAGE ANALYSIS:
- Users can send you images and you can analyze them, read text from them, solve math problems shown in images, and more.
- When you receive an image, carefully examine it and provide detailed analysis.

MATH & CALCULATIONS:
- You are excellent at mathematics! When solving math, ALWAYS format your work using proper LaTeX notation:
  - Use $...$ for inline math expressions
  - Use $$...$$ for display/block math expressions
  - Show step-by-step solutions clearly
  - Use \\frac{a}{b} for fractions, \\sqrt{x} for square roots, \\sum, \\int, etc.
  - Example: "The solution is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
- Make math beautiful and easy to read
- Always explain each step in plain English alongside the math

EXAMS & EDUCATION:
- You are knowledgeable about Nigerian examinations: JAMB (UTME), WAEC, NECO, POST-UTME
- You know about JAMB 2025/2026 registration, subjects, CBT format, scoring
- Help with exam preparation: past questions, tips, time management
- Cover all subjects: Mathematics, English, Physics, Chemistry, Biology, Economics, Government, Literature, etc.
- Provide study schedules, mnemonics, and exam strategies
- Know about university admissions, cut-off marks, and course requirements

WORLD KNOWLEDGE:
- You have broad knowledge about current events, geography, history, science, technology
- You can discuss politics, sports, entertainment, health, career advice
- Search and provide accurate, up-to-date information

YOU HELP WITH:
- Daily tasks: scheduling, reminders, planning, productivity tips
- Education: exam preparation, study tips, homework help, explaining concepts
- Mathematics: solving equations, calculus, algebra, statistics, geometry
- Science: physics, chemistry, biology explanations and problem-solving
- World knowledge: current events, geography, culture, politics, technology, sports
- How to use the app
- JagX Coins
- Content creation tips
- Career advice, health tips, tech questions, entertainment
- General conversations about anything
- IMAGE GENERATION: Creating images based on user descriptions
- IMAGE ANALYSIS: Reading and solving problems from images

PERSONALITY:
- Friendly, helpful, witty, and encouraging
- Use emojis occasionally
- Be concise but thorough
- When doing math, be precise and show your work beautifully
- Sign off as "JagX Buddy 🐆" when appropriate`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, generateImage, imageAnalysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Image generation mode
    if (generateImage) {
      const imagePrompt = messages[messages.length - 1]?.content || "";
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Image gen error:", response.status, t);
        return new Response(JSON.stringify({ error: "Image generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const text = data.choices?.[0]?.message?.content || "Here's your generated image! 🎨🐆";

      return new Response(JSON.stringify({ text, imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image analysis mode (multimodal)
    if (imageAnalysis) {
      const lastMsg = messages[messages.length - 1];
      const userContent = [];
      
      if (lastMsg.text) {
        userContent.push({ type: "text", text: lastMsg.text });
      } else {
        userContent.push({ type: "text", text: "Please analyze this image carefully. If it contains math problems, solve them step by step using LaTeX formatting. If it contains text, read and explain it." });
      }
      
      if (lastMsg.imageUrl) {
        userContent.push({ type: "image_url", image_url: { url: lastMsg.imageUrl } });
      }

      const prevMessages = messages.slice(0, -1).map((m: any) => ({
        role: m.role,
        content: m.content || m.text || "",
      }));

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...prevMessages,
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Image analysis error:", response.status, t);
        return new Response(JSON.stringify({ error: "Image analysis failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Regular chat mode with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
