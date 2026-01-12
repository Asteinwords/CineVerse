import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
// New API-free services
import { searchByDescription, searchByTitle } from '../services/tmdbKeywordSearch.js';
import { matchImageToMovie, matchVideoToMovie } from '../services/imageMatchingService.js';
import { validateImage, optimizeImage } from '../utils/imageProcessor.js';
import { validateVideo, extractFrames, cleanupTempFiles } from '../utils/videoProcessor.js';
// AI Vision services for exact movie identification
import { identifyMovieFromImage, identifyMovieFromVideo } from '../services/vibeService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../temp/uploads');
if (!fsSync.existsSync(uploadDir)) {
    fsSync.mkdirSync(uploadDir, { recursive: true });
}


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Helper: Fetch full movie details from TMDB
 */
async function fetchMovieDetails(title, year, type = 'movie') {
    const TMDB_KEY = process.env.TMDB_API_KEY;

    try {
        // Search for the movie by title
        const searchEndpoint = type === 'tv' ? 'search/tv' : 'search/movie';
        const searchResponse = await axios.get(`${TMDB_BASE_URL}/${searchEndpoint}`, {
            params: {
                api_key: TMDB_KEY,
                query: title,
                year: year || undefined
            },
            timeout: 10000
        });

        const results = searchResponse.data.results || [];
        if (results.length === 0) {
            return null;
        }

        // Get the first result (most relevant)
        const movie = results[0];

        return {
            id: movie.id,
            title: movie.title || movie.name,
            poster: movie.poster_path,
            backdrop: movie.backdrop_path,
            overview: movie.overview,
            rating: movie.vote_average,
            releaseDate: movie.release_date || movie.first_air_date,
            type: type
        };
    } catch (error) {
        console.error(`Error fetching movie details for "${title}":`, error.message);
        return null;
    }
}

/**
 * POST /api/scene-search/text
 * Search movies by text description using keyword-based TMDB matching (no AI required)
 */
router.post('/text', async (req, res) => {
    try {
        const { description, type, limit = 20 } = req.body;

        if (!description || description.trim().length === 0) {
            return res.status(400).json({ error: 'Description is required' });
        }

        console.log(`🎬 Keyword-based search: "${description}"`);

        // Search using keyword matching and genre discovery (no AI)
        const results = await searchByDescription(description, {
            limit: parseInt(limit),
            type: type || 'movie'
        });

        // Format results
        const formattedResults = results.map(movie => ({
            id: movie.id,
            title: movie.title,
            poster: movie.poster,
            backdrop: movie.backdrop,
            overview: movie.overview,
            rating: movie.rating,
            releaseDate: movie.releaseDate,
            type: movie.type,
            matchScore: movie.matchScore,
            genres: movie.genres
        }));

        console.log(`✅ Returning ${formattedResults.length} keyword-matched results`);

        res.json({
            query: description,
            results: formattedResults,
            count: formattedResults.length,
            source: 'keyword_matching'
        });

    } catch (error) {
        console.error('Text search error:', error);
        res.status(500).json({
            error: 'Failed to search by text description',
            message: error.message
        });
    }
});

/**
 * POST /api/scene-search/image
 * Identify movie from uploaded image using AI Vision + Computer Vision
 */
router.post('/image', upload.single('image'), async (req, res) => {
    let tempFiles = [];

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        tempFiles.push(req.file.path);

        // Validate image
        validateImage(req.file);

        // Read and optimize image
        const imageBuffer = await fs.readFile(req.file.path);
        const optimizedBuffer = await optimizeImage(imageBuffer);

        const { type, limit = 20 } = req.body;

        let aiIdentifiedMovie = null;
        let aiIdentification = null;
        let excludeMovieId = null;

        // Step 1: Try AI Vision for exact movie identification
        try {
            console.log('🤖 Using AI Vision to identify exact movie...');
            aiIdentification = await identifyMovieFromImage(optimizedBuffer);

            if (aiIdentification.identified && aiIdentification.movieTitle) {
                console.log(`✓ AI identified: "${aiIdentification.movieTitle}" (${aiIdentification.confidence} confidence)`);

                // Fetch full movie details from TMDB
                const movieDetails = await fetchMovieDetails(
                    aiIdentification.movieTitle,
                    aiIdentification.year,
                    aiIdentification.type || type || 'movie'
                );

                if (movieDetails) {
                    aiIdentifiedMovie = {
                        ...movieDetails,
                        aiIdentified: true,
                        confidence: aiIdentification.confidence,
                        scene: aiIdentification.scene,
                        characters: aiIdentification.characters,
                        reasoning: aiIdentification.reasoning,
                        matchingMethod: 'ai_vision'
                    };
                    excludeMovieId = movieDetails.id;
                    console.log(`✓ Fetched TMDB details for "${movieDetails.title}"`);
                } else {
                    console.log(`⚠️  Could not find "${aiIdentification.movieTitle}" in TMDB`);
                }
            } else {
                console.log('ℹ️  AI could not identify the movie with confidence');
            }
        } catch (aiError) {
            console.error('AI Vision identification failed:', aiError.message);
            console.log('→ Continuing with computer vision only');
        }

        // Step 2: Use computer vision to find visually similar movies
        console.log('🎬 Finding visually similar movies using computer vision...');

        const matchResult = await matchImageToMovie(optimizedBuffer, {
            type: type || 'movie',
            limit: parseInt(limit),
            excludeId: excludeMovieId // Don't show the AI-identified movie again
        });

        // Format similar movies (from computer vision)
        const formattedSimilarMovies = [];

        // Add computer vision identified movie if no AI identification
        if (!aiIdentifiedMovie && matchResult.identifiedMovie) {
            formattedSimilarMovies.push({
                id: matchResult.identifiedMovie.id,
                title: matchResult.identifiedMovie.title,
                poster: matchResult.identifiedMovie.poster,
                backdrop: matchResult.identifiedMovie.backdrop,
                overview: matchResult.identifiedMovie.overview,
                rating: matchResult.identifiedMovie.rating,
                releaseDate: matchResult.identifiedMovie.releaseDate,
                type: matchResult.identifiedMovie.type,
                matchScore: matchResult.identifiedMovie.matchScore,
                matchingMethod: 'computer_vision'
            });
        }

        // Add alternative results
        matchResult.alternativeResults.forEach(movie => {
            if (!excludeMovieId || movie.id !== excludeMovieId) {
                formattedSimilarMovies.push({
                    id: movie.id,
                    title: movie.title,
                    poster: movie.poster,
                    backdrop: movie.backdrop,
                    overview: movie.overview,
                    rating: movie.rating,
                    releaseDate: movie.releaseDate,
                    type: movie.type,
                    matchScore: movie.matchScore,
                    matchingMethod: 'computer_vision'
                });
            }
        });

        console.log(`✅ Returning ${aiIdentifiedMovie ? '1 AI-identified movie' : '0 AI-identified'} + ${formattedSimilarMovies.length} similar movies`);

        res.json({
            identified: !!aiIdentifiedMovie,
            identifiedMovie: aiIdentifiedMovie,
            confidence: aiIdentifiedMovie ? aiIdentifiedMovie.confidence : 'low',
            alternativeResults: formattedSimilarMovies,
            count: (aiIdentifiedMovie ? 1 : 0) + formattedSimilarMovies.length,
            source: aiIdentifiedMovie ? 'ai_vision' : 'computer_vision',
            aiReasoning: aiIdentification?.reasoning
        });

    } catch (error) {
        console.error('Image search error:', error);
        res.status(500).json({
            error: 'Failed to search by image',
            message: error.message
        });
    } finally {
        // Cleanup temp files
        await cleanupTempFiles(tempFiles);
    }
});

/**
 * POST /api/scene-search/video
 * Identify movie from uploaded video using AI Vision + Computer Vision
 */
router.post('/video', upload.single('video'), async (req, res) => {
    let tempFiles = [];

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        tempFiles.push(req.file.path);

        // Validate video
        await validateVideo(req.file);

        // Extract frames from video
        const framePaths = await extractFrames(req.file.path, 5);
        tempFiles.push(...framePaths);

        // Read frame buffers
        const frameBuffers = await Promise.all(
            framePaths.map(framePath => fs.readFile(framePath))
        );

        const { type, limit = 20 } = req.body;

        let aiIdentifiedMovie = null;
        let aiIdentification = null;
        let excludeMovieId = null;

        // Step 1: Try AI Vision for exact movie identification from video frames
        try {
            console.log('🤖 Using AI Vision to identify exact movie from video frames...');
            aiIdentification = await identifyMovieFromVideo(frameBuffers);

            if (aiIdentification.identified && aiIdentification.movieTitle) {
                console.log(`✓ AI identified: "${aiIdentification.movieTitle}" (${aiIdentification.confidence} confidence)`);

                // Fetch full movie details from TMDB
                const movieDetails = await fetchMovieDetails(
                    aiIdentification.movieTitle,
                    aiIdentification.year,
                    aiIdentification.type || type || 'movie'
                );

                if (movieDetails) {
                    aiIdentifiedMovie = {
                        ...movieDetails,
                        aiIdentified: true,
                        confidence: aiIdentification.confidence,
                        scene: aiIdentification.scene,
                        characters: aiIdentification.characters,
                        reasoning: aiIdentification.reasoning,
                        matchingMethod: 'ai_vision_video'
                    };
                    excludeMovieId = movieDetails.id;
                    console.log(`✓ Fetched TMDB details for "${movieDetails.title}"`);
                } else {
                    console.log(`⚠️  Could not find "${aiIdentification.movieTitle}" in TMDB`);
                }
            } else {
                console.log('ℹ️  AI could not identify the movie with confidence');
            }
        } catch (aiError) {
            console.error('AI Vision video identification failed:', aiError.message);
            console.log('→ Continuing with computer vision only');
        }

        // Step 2: Use computer vision to find visually similar movies
        console.log('🎬 Finding visually similar movies using computer vision...');

        const matchResult = await matchVideoToMovie(frameBuffers, {
            type: type || 'movie',
            limit: parseInt(limit),
            excludeId: excludeMovieId // Don't show the AI-identified movie again
        });

        // Format similar movies (from computer vision)
        const formattedSimilarMovies = [];

        // Add computer vision identified movie if no AI identification
        if (!aiIdentifiedMovie && matchResult.identifiedMovie) {
            formattedSimilarMovies.push({
                id: matchResult.identifiedMovie.id,
                title: matchResult.identifiedMovie.title,
                poster: matchResult.identifiedMovie.poster,
                backdrop: matchResult.identifiedMovie.backdrop,
                overview: matchResult.identifiedMovie.overview,
                rating: matchResult.identifiedMovie.rating,
                releaseDate: matchResult.identifiedMovie.releaseDate,
                type: matchResult.identifiedMovie.type,
                matchScore: matchResult.identifiedMovie.matchScore,
                frameMatches: matchResult.identifiedMovie.frameMatches,
                matchingMethod: 'computer_vision_video'
            });
        }

        // Add alternative results
        matchResult.alternativeResults.forEach(movie => {
            if (!excludeMovieId || movie.id !== excludeMovieId) {
                formattedSimilarMovies.push({
                    id: movie.id,
                    title: movie.title,
                    poster: movie.poster,
                    backdrop: movie.backdrop,
                    overview: movie.overview,
                    rating: movie.rating,
                    releaseDate: movie.releaseDate,
                    type: movie.type,
                    matchScore: movie.matchScore,
                    frameMatches: movie.frameMatches,
                    matchingMethod: 'computer_vision_video'
                });
            }
        });

        console.log(`✅ Returning ${aiIdentifiedMovie ? '1 AI-identified movie' : '0 AI-identified'} + ${formattedSimilarMovies.length} similar movies`);

        res.json({
            identified: !!aiIdentifiedMovie,
            identifiedMovie: aiIdentifiedMovie,
            confidence: aiIdentifiedMovie ? aiIdentifiedMovie.confidence : 'low',
            alternativeResults: formattedSimilarMovies,
            count: (aiIdentifiedMovie ? 1 : 0) + formattedSimilarMovies.length,
            source: aiIdentifiedMovie ? 'ai_vision_video' : 'computer_vision_video',
            framesAnalyzed: frameBuffers.length,
            aiReasoning: aiIdentification?.reasoning
        });

    } catch (error) {
        console.error('Video search error:', error);
        res.status(500).json({
            error: 'Failed to search by video',
            message: error.message
        });
    } finally {
        // Cleanup temp files
        await cleanupTempFiles(tempFiles);
    }
});

// Removed deprecated /movie/:id/vibe endpoint (required AI embeddings)
// Use TMDB API directly for movie details instead

export default router;
