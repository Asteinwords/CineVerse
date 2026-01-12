import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractDominantColors, imageToBase64 } from '../utils/imageProcessor.js';

let openai = null;
let gemini = null;

// Lazy initialization to ensure env vars are loaded
function getOpenAIClient() {
    if (!openai && process.env.OPENAI_API_KEY) {
        console.log('Initializing OpenAI client...');
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    return openai;
}

function getGeminiClient() {
    if (!gemini && process.env.GEMINI_API_KEY) {
        console.log('Initializing Gemini client...');
        gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return gemini;
}

// Check which AI provider is available
function getAvailableProvider() {
    const openaiClient = getOpenAIClient();
    const geminiClient = getGeminiClient();

    if (openaiClient) return 'openai';
    if (geminiClient) return 'gemini';
    return null;
}

/**
 * Generate a vibe description for a movie based on its metadata
 */
export async function generateMovieVibeDescription(movieData) {
    const client = getOpenAIClient();
    if (!client) {
        throw new Error('OpenAI API key not configured');
    }

    const { title, overview, genres, keywords } = movieData;

    const prompt = `Create a detailed aesthetic, emotional, and tonal description for the movie "${title}".

Based on:
- Plot: ${overview || 'N/A'}
- Genres: ${genres?.join(', ') || 'N/A'}
- Keywords: ${keywords?.slice(0, 10).join(', ') || 'N/A'}

Describe the movie's:
1. Visual aesthetic and cinematography style
2. Emotional tone and atmosphere
3. Color palette and lighting
4. Pacing and mood
5. Overall vibe and feeling

Output a 300-500 character abstract "vibe summary" that captures the essence of this movie's aesthetic experience.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a film aesthetics expert who describes movies in terms of their visual style, emotional tone, and atmospheric qualities.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating movie vibe description:', error);
        throw error;
    }
}

/**
 * Generate embedding vector from text using OpenAI or Gemini
 */
export async function generateEmbedding(text) {
    const provider = getAvailableProvider();

    if (!provider) {
        throw new Error('No AI provider configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in .env');
    }

    // Try OpenAI first
    if (provider === 'openai') {
        try {
            const client = getOpenAIClient();
            const response = await client.embeddings.create({
                model: 'text-embedding-3-large',
                input: text,
                dimensions: 1536
            });
            console.log('✓ Used OpenAI for embedding');
            return response.data[0].embedding;
        } catch (error) {
            console.error('OpenAI embedding failed:', error.message);
            // Try Gemini fallback
            const geminiClient = getGeminiClient();
            if (geminiClient) {
                console.log('→ Falling back to Gemini for embedding');
                return await generateGeminiEmbedding(text, geminiClient);
            }
            throw error;
        }
    }

    // Use Gemini
    if (provider === 'gemini') {
        const geminiClient = getGeminiClient();
        return await generateGeminiEmbedding(text, geminiClient);
    }
}

async function generateGeminiEmbedding(text, geminiClient) {
    try {
        const model = geminiClient.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        const embedding = result.embedding.values;

        // Gemini embeddings are 768-dimensional, pad to 1536 to match OpenAI
        const paddedEmbedding = new Array(1536).fill(0);
        for (let i = 0; i < embedding.length && i < 1536; i++) {
            paddedEmbedding[i] = embedding[i];
        }

        console.log('✓ Used Gemini for embedding');
        return paddedEmbedding;
    } catch (error) {
        console.error('Gemini embedding failed:', error.message);
        throw error;
    }
}

/**
 * Identify a specific movie from an uploaded image
 */
export async function identifyMovieFromImage(imageBuffer) {
    const provider = getAvailableProvider();

    if (!provider) {
        throw new Error('No AI provider configured');
    }

    const prompt = `Analyze this image carefully and try to identify the specific movie or TV show it's from.

Provide your response in the following JSON format:
{
  "identified": true or false,
  "movieTitle": "Exact movie/show title" or null,
  "year": release year as number or null,
  "type": "movie" or "tv" or null,
  "scene": "Brief description of this specific scene",
  "characters": ["Character names if recognizable"],
  "confidence": "high" or "medium" or "low",
  "reasoning": "Explain what visual cues helped you identify it, or why you couldn't identify it"
}

Be honest about your confidence level. Only mark as "identified: true" if you're reasonably confident about the movie title.`;

    // Try OpenAI first (use GPT-4o for better recognition)
    if (provider === 'openai') {
        try {
            const client = getOpenAIClient();
            const base64Image = imageToBase64(imageBuffer);

            const completion = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a movie and TV show expert with extensive knowledge of films, actors, scenes, and cinematography. Your task is to identify movies from images with high accuracy.'
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 500,
                temperature: 0.3
            });

            const result = JSON.parse(completion.choices[0].message.content);
            console.log('✓ Used GPT-4o for movie identification:', result.identified ? result.movieTitle : 'Not identified');

            return result;
        } catch (error) {
            console.error('OpenAI movie identification failed:', error.message);
            // Try Gemini fallback
            const geminiClient = getGeminiClient();
            if (geminiClient) {
                try {
                    console.log('→ Attempting Gemini fallback for movie identification');
                    return await identifyMovieWithGemini(imageBuffer, prompt, geminiClient);
                } catch (geminiError) {
                    console.error('Gemini fallback also failed:', geminiError.message);
                    console.log('💡 Tip: Check your GEMINI_API_KEY configuration and model access permissions');
                    // Return the original OpenAI error since Gemini also failed
                    throw error;
                }
            }
            throw error;
        }
    }

    // Use Gemini if OpenAI is not available
    if (provider === 'gemini') {
        const geminiClient = getGeminiClient();
        return await identifyMovieWithGemini(imageBuffer, prompt, geminiClient);
    }

    throw new Error('Movie identification requires either OpenAI or Gemini API key. Please configure OPENAI_API_KEY or GEMINI_API_KEY in .env');
}

async function identifyMovieWithGemini(imageBuffer, prompt, geminiClient) {
    try {
        const model = geminiClient.getGenerativeModel({
            model: 'gemini-pro-vision',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = JSON.parse(result.response.text());
        console.log('✓ Used Gemini 1.5 Flash for movie identification:', response.identified ? response.movieTitle : 'Not identified');

        return response;
    } catch (error) {
        console.error('Gemini movie identification failed:', error.message);
        throw error;
    }
}

/**
 * Analyze image and extract aesthetic description using GPT-4o-mini Vision or Gemini Vision
 */
export async function analyzeImage(imageBuffer) {
    const provider = getAvailableProvider();

    if (!provider) {
        throw new Error('No AI provider configured');
    }

    // Extract color palette
    const colors = await extractDominantColors(imageBuffer);

    const prompt = `Describe the aesthetic, mood, tone, lighting, colors, emotional impact, and vibe of this scene in 5-6 sentences. Focus on:
- Atmosphere and cinematography style
- Emotions and feelings evoked
- Color palette and lighting
- Visual storytelling elements
- Overall cinematic vibe

Be specific and descriptive.`;

    // Try OpenAI first
    if (provider === 'openai') {
        try {
            const client = getOpenAIClient();
            const base64Image = imageToBase64(imageBuffer);

            const completion = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a visual aesthetics expert. Analyze images and describe their cinematic qualities, mood, atmosphere, lighting, color palette, and emotional impact.'
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`,
                                    detail: 'low'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            const description = completion.choices[0].message.content;
            console.log('✓ Used OpenAI Vision for image analysis');

            return {
                description,
                colors,
                emotionalTones: extractEmotionalTones(description)
            };
        } catch (error) {
            console.error('OpenAI Vision failed:', error.message);
            // Try Gemini fallback
            const geminiClient = getGeminiClient();
            if (geminiClient) {
                try {
                    console.log('→ Attempting Gemini Vision fallback');
                    return await analyzeImageWithGemini(imageBuffer, colors, prompt, geminiClient);
                } catch (geminiError) {
                    console.error('Gemini Vision fallback also failed:', geminiError.message);
                    console.log('💡 Tip: Gemini API may not be properly configured. Using OpenAI only.');
                    throw error;
                }
            }
            throw error;
        }
    }

    // Use Gemini
    if (provider === 'gemini') {
        const geminiClient = getGeminiClient();
        return await analyzeImageWithGemini(imageBuffer, colors, prompt, geminiClient);
    }
}

async function analyzeImageWithGemini(imageBuffer, colors, prompt, geminiClient) {
    try {
        const model = geminiClient.getGenerativeModel({ model: 'gemini-pro-vision' });

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const description = result.response.text();
        console.log('✓ Used Gemini Vision for image analysis');

        return {
            description,
            colors,
            emotionalTones: extractEmotionalTones(description)
        };
    } catch (error) {
        console.error('Gemini Vision failed:', error.message);
        throw error;
    }
}

/**
 * Identify a specific movie from an uploaded video
 */
export async function identifyMovieFromVideo(frameBuffers) {
    const provider = getAvailableProvider();

    if (!provider) {
        throw new Error('No AI provider configured');
    }

    // Use middle frames for better identification
    const framesToAnalyze = frameBuffers.length > 3
        ? [frameBuffers[0], frameBuffers[Math.floor(frameBuffers.length / 2)], frameBuffers[frameBuffers.length - 1]]
        : frameBuffers;

    const prompt = `Analyze these frames from a video clip and try to identify the specific movie or TV show.

Provide your response in the following JSON format:
{
  "identified": true or false,
  "movieTitle": "Exact movie/show title" or null,
  "year": release year as number or null,
  "type": "movie" or "tv" or null,
  "scene": "Brief description of this scene/sequence",
  "characters": ["Character names if recognizable"],
  "confidence": "high" or "medium" or "low",
  "reasoning": "Explain what visual cues across the frames helped you identify it, or why you couldn't"
}

Look for consistent elements across frames like characters, settings, cinematography style, or recognizable scenes.`;

    // Try OpenAI first (use GPT-4o for better recognition)
    if (provider === 'openai') {
        try {
            const client = getOpenAIClient();

            const imageContents = framesToAnalyze.map(buffer => ({
                type: 'image_url',
                image_url: {
                    url: `data:image/jpeg;base64,${imageToBase64(buffer)}`,
                    detail: 'high'
                }
            }));

            const completion = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a movie and TV show expert with extensive knowledge of films, actors, scenes, and cinematography. Your task is to identify movies from video frames with high accuracy.'
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            ...imageContents
                        ]
                    }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 500,
                temperature: 0.3
            });

            const result = JSON.parse(completion.choices[0].message.content);
            console.log('✓ Used GPT-4o for video movie identification:', result.identified ? result.movieTitle : 'Not identified');

            return result;
        } catch (error) {
            console.error('OpenAI video identification failed:', error.message);
            // Try Gemini fallback
            const geminiClient = getGeminiClient();
            if (geminiClient) {
                try {
                    console.log('→ Attempting Gemini fallback for video identification');
                    return await identifyMovieFromVideoWithGemini(framesToAnalyze, prompt, geminiClient);
                } catch (geminiError) {
                    console.error('Gemini video fallback also failed:', geminiError.message);
                    console.log('💡 Tip: Check your GEMINI_API_KEY configuration and model access permissions');
                    throw error;
                }
            }
            throw error;
        }
    }

    // Use Gemini if OpenAI is not available
    if (provider === 'gemini') {
        const geminiClient = getGeminiClient();
        return await identifyMovieFromVideoWithGemini(framesToAnalyze, prompt, geminiClient);
    }

    throw new Error('Movie identification requires either OpenAI or Gemini API key. Please configure OPENAI_API_KEY or GEMINI_API_KEY in .env');
}

async function identifyMovieFromVideoWithGemini(frameBuffers, prompt, geminiClient) {
    try {
        const model = geminiClient.getGenerativeModel({
            model: 'gemini-pro-vision',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const imageParts = frameBuffers.map(buffer => ({
            inlineData: {
                data: buffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        }));

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = JSON.parse(result.response.text());
        console.log('✓ Used Gemini 1.5 Flash for video identification:', response.identified ? response.movieTitle : 'Not identified');

        return response;
    } catch (error) {
        console.error('Gemini video identification failed:', error.message);
        throw error;
    }
}

/**
 * Analyze video by extracting and analyzing multiple frames
 */
export async function analyzeVideoFrames(frameBuffers) {
    const client = getOpenAIClient();
    if (!client) {
        throw new Error('OpenAI API key not configured');
    }

    const frameAnalyses = [];

    // Analyze each frame
    for (const buffer of frameBuffers) {
        try {
            const analysis = await analyzeImage(buffer);
            frameAnalyses.push(analysis.description);
        } catch (error) {
            console.error('Error analyzing frame:', error);
        }
    }

    if (frameAnalyses.length === 0) {
        throw new Error('Failed to analyze any frames');
    }

    // Combine frame analyses into a cohesive description
    const combinedPrompt = `Based on these scene descriptions from a video clip, create a unified aesthetic description:

${frameAnalyses.map((desc, i) => `Frame ${i + 1}: ${desc}`).join('\n\n')}

Synthesize these into a single 5-6 sentence description capturing:
- Overall visual aesthetic and cinematography
- Consistent mood and atmosphere
- Color palette and lighting style
- Emotional tone
- Cinematic vibe

Focus on the common themes and overall feeling.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a film aesthetics expert who synthesizes visual descriptions into cohesive cinematic vibe summaries.'
                },
                {
                    role: 'user',
                    content: combinedPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        return {
            description: completion.choices[0].message.content,
            frameCount: frameAnalyses.length
        };
    } catch (error) {
        console.error('Error combining frame analyses:', error);
        throw error;
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] * vectorA[i];
        magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Extract emotional tones from description text
 */
function extractEmotionalTones(text) {
    const toneKeywords = {
        melancholic: ['melancholic', 'melancholy', 'sad', 'sorrowful', 'gloomy'],
        nostalgic: ['nostalgic', 'nostalgia', 'reminiscent', 'wistful'],
        uplifting: ['uplifting', 'hopeful', 'inspiring', 'optimistic', 'joyful'],
        tense: ['tense', 'suspenseful', 'anxious', 'nervous', 'uneasy'],
        peaceful: ['peaceful', 'calm', 'serene', 'tranquil', 'relaxing'],
        dark: ['dark', 'ominous', 'sinister', 'foreboding', 'grim'],
        energetic: ['energetic', 'dynamic', 'vibrant', 'lively', 'intense'],
        romantic: ['romantic', 'intimate', 'tender', 'passionate', 'loving']
    };

    const lowerText = text.toLowerCase();
    const tones = [];

    for (const [tone, keywords] of Object.entries(toneKeywords)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            tones.push(tone);
        }
    }

    return tones;
}


