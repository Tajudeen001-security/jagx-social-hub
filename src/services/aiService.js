// AI Service - No SDK needed!

export const generateSocialContent = async (prompt, contentType = "caption") => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const socialPrompt = `
      You are JagX Buddy AI, a creative social media content generator.
      Create engaging, friendly content for: ${prompt}
      Type: ${contentType}
      Keep it fun, positive, and use emojis appropriately!
      Make it 1-3 sentences max.
    `;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: socialPrompt
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return {
        success: true,
        content: data.candidates[0].content.parts[0].text
      };
    } else {
      throw new Error('No content generated');
    }
    
  } catch (error) {
    console.error("AI Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate content"
    };
  }
};

export const generateCaption = (prompt) => generateSocialContent(prompt, "caption");
export const generatePost = (prompt) => generateSocialContent(prompt, "post");
