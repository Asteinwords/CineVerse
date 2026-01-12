import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI client - only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Fallback sentiment analysis function
function performFallbackAnalysis(reviews) {
  const sentimentKeywords = {
    positive: ['amazing', 'excellent', 'great', 'love', 'fantastic', 'wonderful', 'masterpiece', 'brilliant', 'perfect'],
    negative: ['bad', 'terrible', 'awful', 'hate', 'disappointing', 'poor', 'waste', 'boring', 'worst']
  };

  let positiveCount = 0;
  let negativeCount = 0;

  reviews.forEach(review => {
    const content = review.content.toLowerCase();

    sentimentKeywords.positive.forEach(word => {
      if (content.includes(word)) positiveCount++;
    });
    sentimentKeywords.negative.forEach(word => {
      if (content.includes(word)) negativeCount++;
    });
  });

  const total = positiveCount + negativeCount || 1;
  const posPercent = Math.round((positiveCount / total) * 100);
  const negPercent = Math.round((negativeCount / total) * 100);
  const neuPercent = 100 - posPercent - negPercent;

  return {
    summary: positiveCount > negativeCount
      ? 'This title has received predominantly positive reviews from viewers.'
      : negativeCount > positiveCount
        ? 'This title has received mixed to negative reviews from critics.'
        : 'This title has received mixed reviews from the community.',
    sentiment: {
      positive: Math.max(posPercent, 0),
      neutral: Math.max(neuPercent, 0),
      negative: Math.max(negPercent, 0)
    },
    keyThemes: ['User opinions vary', 'Check individual reviews for details'],
    overallRating: 5,
    reviewCount: reviews.length,
    fallback: true
  };
}

// Analyze reviews and generate comprehensive summary
router.post('/analyze-reviews', async (req, res) => {
  try {
    const { reviews, movieTitle } = req.body;

    if (!reviews || reviews.length === 0) {
      return res.json({
        summary: 'No reviews available yet. Be the first to share your thoughts!',
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        keyThemes: [],
        overallRating: 0
      });
    }

    // Check if OpenAI is available
    if (!openai) {
      console.log('OpenAI not configured, using fallback analysis');
      return res.json(performFallbackAnalysis(reviews));
    }

    // Prepare review text for analysis
    const reviewTexts = reviews.slice(0, 10).map((r, i) =>
      `Review ${i + 1}: ${r.content.substring(0, 500)}`
    ).join('\n\n');

    const prompt = `Analyze the following reviews for the movie/show "${movieTitle}" and provide:
1. A concise 2-3 sentence summary of the overall consensus
2. Sentiment breakdown (percentage of positive, neutral, negative)
3. 3-5 key themes or topics mentioned across reviews
4. Overall rating impression (1-10 scale)

Reviews:
${reviewTexts}

Respond in JSON format:
{
  "summary": "string",
  "sentiment": {
    "positive": number (0-100),
    "neutral": number (0-100),
    "negative": number (0-100)
  },
  "keyThemes": ["theme1", "theme2", "theme3"],
  "overallRating": number (1-10)
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a film critic and review analyst. Provide insightful, balanced analysis of movie reviews."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    res.json({
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      keyThemes: analysis.keyThemes || [],
      overallRating: analysis.overallRating || 0,
      reviewCount: reviews.length
    });

  } catch (error) {
    console.error('OpenAI analysis error:', error);
    // Use fallback on error
    res.json(performFallbackAnalysis(req.body.reviews));
  }
});

export default router;
