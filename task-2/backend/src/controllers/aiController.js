// AI Controller - Powered by Google Gemini API
// Falls back gracefully if GEMINI_API_KEY is not set

const callGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// @route POST /api/ai/caption
exports.generateCaption = async (req, res, next) => {
  try {
    const { context, tone = 'casual', platform = 'social media' } = req.body;
    const prompt = `Generate 3 engaging ${tone} captions for a ${platform} post about: "${context}". 
    Format as a JSON array: ["caption1", "caption2", "caption3"]. 
    Make them compelling, authentic, and under 150 characters each.`;

    const text = await callGemini(prompt);
    const match = text.match(/\[[\s\S]*\]/);
    const captions = match ? JSON.parse(match[0]) : [text.trim()];
    res.json({ success: true, captions });
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.json({ success: true, captions: ['Add your caption here ✨', 'Sharing this moment 📸', 'Living my best life 🌟'], mock: true });
    }
    next(error);
  }
};

// @route POST /api/ai/hashtags
exports.generateHashtags = async (req, res, next) => {
  try {
    const { content, count = 10 } = req.body;
    const prompt = `Generate ${count} relevant, trending hashtags for this social media post: "${content}".
    Include a mix of popular and niche hashtags. 
    Return ONLY a JSON array of strings without the # symbol: ["hashtag1", "hashtag2", ...]`;

    const text = await callGemini(prompt);
    const match = text.match(/\[[\s\S]*\]/);
    const hashtags = match ? JSON.parse(match[0]) : [];
    res.json({ success: true, hashtags });
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.json({ success: true, hashtags: ['trending', 'viral', 'instagood', 'photooftheday', 'lifestyle'], mock: true });
    }
    next(error);
  }
};

// @route POST /api/ai/comment-suggestions
exports.suggestComments = async (req, res, next) => {
  try {
    const { postContent, tone = 'friendly' } = req.body;
    const prompt = `Suggest 3 ${tone} comment responses for this social media post: "${postContent}".
    Make them genuine, engaging, and conversational. Under 100 characters each.
    Return as JSON array: ["comment1", "comment2", "comment3"]`;

    const text = await callGemini(prompt);
    const match = text.match(/\[[\s\S]*\]/);
    const suggestions = match ? JSON.parse(match[0]) : [text.trim()];
    res.json({ success: true, suggestions });
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.json({ success: true, suggestions: ['Amazing! 🔥', 'Love this so much! ❤️', 'This is everything! ✨'], mock: true });
    }
    next(error);
  }
};

// @route POST /api/ai/summarize
exports.summarizePost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const prompt = `Summarize this social media post in 1-2 concise sentences: "${content}". Be neutral and factual.`;
    const summary = await callGemini(prompt);
    res.json({ success: true, summary: summary.trim() });
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.json({ success: true, summary: 'AI summary not available. Configure GEMINI_API_KEY to enable.', mock: true });
    }
    next(error);
  }
};

// @route POST /api/ai/moderate
exports.moderateContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    const prompt = `Analyze this social media post for policy violations. Check for: spam, hate speech, harassment, explicit content, misinformation, or dangerous content.
    Post: "${content}"
    
    Return JSON: {
      "safe": true/false,
      "score": 0-100 (0=safe, 100=very harmful),
      "flags": ["category1", "category2"],
      "reason": "brief explanation"
    }`;

    const text = await callGemini(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : { safe: true, score: 0, flags: [], reason: 'Unable to analyze' };
    res.json({ success: true, moderation: result });
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.json({ success: true, moderation: { safe: true, score: 0, flags: [], reason: 'AI moderation not configured.' }, mock: true });
    }
    next(error);
  }
};
