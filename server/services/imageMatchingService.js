import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const POSTER_CACHE_DIR = path.join(__dirname, '../temp/poster_cache');

// Ensure cache directory exists
fs.mkdir(POSTER_CACHE_DIR, { recursive: true }).catch(() => { });

/**
 * Extract color histogram from image buffer
 */
async function extractColorHistogram(buffer) {
    try {
        const { dominant } = await sharp(buffer).stats();

        const dominantColor = {
            r: dominant.r,
            g: dominant.g,
            b: dominant.b
        };

        const hsv = rgbToHsv(dominantColor.r, dominantColor.g, dominantColor.b);

        return {
            rgb: dominantColor,
            hsv: hsv,
            hex: rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b)
        };
    } catch (error) {
        console.error('Color extraction error:', error);
        return null;
    }
}

/**
 * Generate perceptual hash for image using sharp
 */
async function generatePerceptualHash(buffer) {
    try {
        const resized = await sharp(buffer)
            .resize(8, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();

        let sum = 0;
        for (let i = 0; i < resized.length; i++) {
            sum += resized[i];
        }
        const average = sum / resized.length;

        let hash = '';
        for (let i = 0; i < resized.length; i++) {
            hash += resized[i] >= average ? '1' : '0';
        }

        return hash;
    } catch (error) {
        console.error('Perceptual hash error:', error);
        return null;
    }
}

/**
 * Calculate Hamming distance between two hashes
 */
function hammingDistance(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) {
        return 100;
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) {
            distance++;
        }
    }

    return distance;
}

/**
 * Calculate color similarity (0-100, higher is more similar)
 */
function calculateColorSimilarity(color1, color2) {
    if (!color1 || !color2) return 0;

    const hDiff = Math.abs(color1.hsv.h - color2.hsv.h);
    const sDiff = Math.abs(color1.hsv.s - color2.hsv.s);
    const vDiff = Math.abs(color1.hsv.v - color2.hsv.v);

    const hSimilarity = 1 - (Math.min(hDiff, 360 - hDiff) / 180);
    const sSimilarity = 1 - (sDiff / 100);
    const vSimilarity = 1 - (vDiff / 100);

    const similarity = (hSimilarity * 0.5 + sSimilarity * 0.3 + vSimilarity * 0.2) * 100;

    return similarity;
}

/**
 * Download and cache TMDB poster with retry logic
 */
async function downloadPoster(posterPath, movieId) {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const cacheFile = path.join(POSTER_CACHE_DIR, `${movieId}.jpg`);

            try {
                await fs.access(cacheFile);
                return await fs.readFile(cacheFile);
            } catch {
                // Not cached
            }

            const imageUrl = `${TMDB_IMAGE_BASE}${posterPath}`;
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            const buffer = Buffer.from(response.data);

            await fs.writeFile(cacheFile, buffer);

            return buffer;
        } catch (error) {
            if (attempt === maxRetries - 1) {
                console.error(`Failed to download poster for movie ${movieId}:`, error.message);
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
    return null;
}

/**
 * Extract features from image
 */
async function extractImageFeatures(buffer) {
    const [colorHistogram, perceptualHash] = await Promise.all([
        extractColorHistogram(buffer),
        generatePerceptualHash(buffer)
    ]);

    return {
        colorHistogram,
        perceptualHash
    };
}

/**
 * Match image against TMDB movie posters
 */
export async function matchImageToMovie(imageBuffer, options = {}) {
    const { type = 'movie', limit = 20 } = options;
    const TMDB_KEY = process.env.TMDB_API_KEY;

    try {
        console.log('🔍 Analyzing uploaded image...');

        const uploadedFeatures = await extractImageFeatures(imageBuffer);

        if (!uploadedFeatures.perceptualHash) {
            throw new Error('Failed to extract image features');
        }

        console.log('📊 Fetching popular movies from TMDB...');

        const endpoint = type === 'tv' ? 'discover/tv' : 'discover/movie';
        const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, {
            params: {
                api_key: TMDB_KEY,
                sort_by: 'popularity.desc',
                'vote_count.gte': 100,
                page: 1
            },
            timeout: 10000
        });

        const movies = response.data.results || [];
        console.log(`📽️  Comparing against top movies...`);

        const matches = [];

        // Reduce to 15 movies and process sequentially
        const moviesToCheck = movies.slice(0, 15);

        for (let i = 0; i < moviesToCheck.length; i++) {
            const movie = moviesToCheck[i];
            if (!movie.poster_path) continue;

            try {
                const posterBuffer = await downloadPoster(movie.poster_path, movie.id);
                if (!posterBuffer) {
                    console.log(`⚠️  Skipping movie ${movie.id}`);
                    continue;
                }

                const posterFeatures = await extractImageFeatures(posterBuffer);

                const hashDistance = hammingDistance(
                    uploadedFeatures.perceptualHash,
                    posterFeatures.perceptualHash
                );

                const colorSimilarity = calculateColorSimilarity(
                    uploadedFeatures.colorHistogram,
                    posterFeatures.colorHistogram
                );

                const hashSimilarity = Math.max(0, 100 - (hashDistance * 1.5625));
                const combinedScore = (hashSimilarity * 0.7) + (colorSimilarity * 0.3);

                if (combinedScore > 25) {
                    matches.push({
                        id: movie.id,
                        title: movie.title || movie.name,
                        poster: movie.poster_path,
                        backdrop: movie.backdrop_path,
                        overview: movie.overview,
                        rating: movie.vote_average,
                        releaseDate: movie.release_date || movie.first_air_date,
                        type: type,
                        matchScore: combinedScore,
                        hashSimilarity: hashSimilarity,
                        colorSimilarity: colorSimilarity
                    });
                }

                // Delay between requests
                if (i < moviesToCheck.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

            } catch (error) {
                console.error(`Error processing movie ${movie.id}:`, error.message);
                continue;
            }
        }

        matches.sort((a, b) => b.matchScore - a.matchScore);

        const topMatches = matches.slice(0, limit);

        console.log(`✅ Found ${topMatches.length} potential matches`);

        const identified = topMatches.length > 0 && topMatches[0].matchScore > 65;

        return {
            identified: identified,
            confidence: identified ? (topMatches[0].matchScore > 80 ? 'high' : 'medium') : 'low',
            identifiedMovie: identified ? topMatches[0] : null,
            alternativeResults: identified ? topMatches.slice(1) : topMatches,
            matchingMethod: 'computer_vision'
        };

    } catch (error) {
        console.error('Image matching error:', error);

        return {
            identified: false,
            confidence: 'low',
            identifiedMovie: null,
            alternativeResults: [],
            matchingMethod: 'computer_vision',
            error: error.message
        };
    }
}

/**
 * Match video frames to movie
 */
export async function matchVideoToMovie(frameBuffers, options = {}) {
    try {
        console.log(`🎬 Analyzing ${frameBuffers.length} video frames...`);

        const frameResults = await Promise.all(
            frameBuffers.map(buffer => matchImageToMovie(buffer, options))
        );

        const movieScores = new Map();

        frameResults.forEach(result => {
            if (result.identifiedMovie) {
                const id = result.identifiedMovie.id;
                const current = movieScores.get(id) || { movie: result.identifiedMovie, totalScore: 0, count: 0 };
                current.totalScore += result.identifiedMovie.matchScore;
                current.count += 1;
                movieScores.set(id, current);
            }

            result.alternativeResults.forEach(movie => {
                const id = movie.id;
                const current = movieScores.get(id) || { movie: movie, totalScore: 0, count: 0 };
                current.totalScore += movie.matchScore * 0.5;
                current.count += 1;
                movieScores.set(id, current);
            });
        });

        const aggregatedResults = Array.from(movieScores.values())
            .map(({ movie, totalScore, count }) => ({
                ...movie,
                matchScore: totalScore / count,
                frameMatches: count
            }))
            .sort((a, b) => b.matchScore - a.matchScore);

        const identified = aggregatedResults.length > 0 && aggregatedResults[0].matchScore > 60;

        console.log(`✅ Video analysis complete. Best match score: ${aggregatedResults[0]?.matchScore.toFixed(2) || 0}`);

        return {
            identified: identified,
            confidence: identified ? (aggregatedResults[0].matchScore > 75 ? 'high' : 'medium') : 'low',
            identifiedMovie: identified ? aggregatedResults[0] : null,
            alternativeResults: identified ? aggregatedResults.slice(1, 11) : aggregatedResults.slice(0, 10),
            matchingMethod: 'computer_vision_video',
            framesAnalyzed: frameBuffers.length
        };

    } catch (error) {
        console.error('Video matching error:', error);
        throw error;
    }
}

/**
 * Helper: RGB to Hex
 */
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Helper: RGB to HSV
 */
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = max === 0 ? 0 : (diff / max) * 100;
    let v = max * 100;

    if (diff !== 0) {
        if (max === r) {
            h = 60 * (((g - b) / diff) % 6);
        } else if (max === g) {
            h = 60 * (((b - r) / diff) + 2);
        } else {
            h = 60 * (((r - g) / diff) + 4);
        }
    }

    if (h < 0) h += 360;

    return { h, s, v };
}
