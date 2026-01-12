import Movie from '../models/Movie.js';
import axios from 'axios';
import { generateMovieVibeDescription, generateEmbedding, calculateCosineSimilarity } from './vibeService.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Get or create movie embedding from database
 */
export async function getOrCreateMovieEmbedding(tmdbId, type = 'movie') {
    try {
        // Check if movie exists in database
        let movie = await Movie.findOne({ tmdbId, type });

        if (movie && movie.vibeEmbedding && movie.vibeEmbedding.length > 0) {
            // Return cached embedding
            return {
                movie,
                cached: true
            };
        }

        // Fetch movie data from TMDB
        const TMDB_KEY = process.env.TMDB_API_KEY;
        const movieType = type === 'anime' ? 'tv' : type;

        const response = await axios.get(`${TMDB_BASE_URL}/${movieType}/${tmdbId}`, {
            params: {
                api_key: TMDB_KEY,
                append_to_response: 'keywords'
            }
        });

        const data = response.data;
        const keywords = data.keywords?.[movieType === 'tv' ? 'results' : 'keywords'] || [];

        const movieData = {
            title: data.title || data.name,
            overview: data.overview,
            genres: data.genres?.map(g => g.name) || [],
            keywords: keywords.map(k => k.name)
        };

        // Generate vibe description
        const vibeDescription = await generateMovieVibeDescription(movieData);

        // Generate embedding
        const vibeEmbedding = await generateEmbedding(vibeDescription);

        // Save or update in database
        if (movie) {
            movie.vibeDescription = vibeDescription;
            movie.vibeEmbedding = vibeEmbedding;
            movie.title = movieData.title;
            movie.genres = movieData.genres;
            movie.keywords = movieData.keywords;
            movie.overview = data.overview;
            movie.posterPath = data.poster_path;
            movie.backdropPath = data.backdrop_path;
            movie.rating = data.vote_average;
            movie.releaseDate = data.release_date || data.first_air_date;
            movie.lastUpdated = new Date();
            await movie.save();
        } else {
            movie = await Movie.create({
                tmdbId,
                type,
                title: movieData.title,
                vibeDescription,
                vibeEmbedding,
                genres: movieData.genres,
                keywords: movieData.keywords,
                overview: data.overview,
                posterPath: data.poster_path,
                backdropPath: data.backdrop_path,
                rating: data.vote_average,
                releaseDate: data.release_date || data.first_air_date
            });
        }

        return {
            movie,
            cached: false
        };
    } catch (error) {
        console.error('Error getting/creating movie embedding:', error);
        throw error;
    }
}

/**
 * Batch generate embeddings for multiple movies
 */
export async function batchGenerateEmbeddings(movieIds, type = 'movie') {
    const results = [];

    for (const tmdbId of movieIds) {
        try {
            const result = await getOrCreateMovieEmbedding(tmdbId, type);
            results.push(result);

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Failed to process movie ${tmdbId}:`, error.message);
            results.push({ tmdbId, error: error.message });
        }
    }

    return results;
}

/**
 * Search for similar movies using embedding similarity
 */
export async function searchSimilarMovies(queryEmbedding, options = {}) {
    const {
        limit = 20,
        type = null,
        minRating = 0
    } = options;

    try {
        // Build query
        const query = {};
        if (type) query.type = type;
        if (minRating > 0) query.rating = { $gte: minRating };

        // Only get movies with embeddings
        query.vibeEmbedding = { $exists: true, $ne: [] };

        // Fetch all movies with embeddings
        const movies = await Movie.find(query).lean();

        if (movies.length === 0) {
            return [];
        }

        // Calculate similarity scores
        const scoredMovies = movies.map(movie => {
            const similarity = calculateCosineSimilarity(queryEmbedding, movie.vibeEmbedding);
            return {
                ...movie,
                similarityScore: similarity
            };
        });

        // Sort by similarity and return top results
        scoredMovies.sort((a, b) => b.similarityScore - a.similarityScore);

        return scoredMovies.slice(0, limit);
    } catch (error) {
        console.error('Error searching similar movies:', error);
        throw error;
    }
}

/**
 * Get popular movies and ensure they have embeddings
 */
export async function ensurePopularMoviesHaveEmbeddings(count = 50) {
    try {
        const TMDB_KEY = process.env.TMDB_API_KEY;

        // Fetch popular movies from TMDB
        const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
            params: {
                api_key: TMDB_KEY,
                page: 1
            }
        });

        const movieIds = response.data.results.slice(0, count).map(m => m.id);

        // Generate embeddings for these movies
        const results = await batchGenerateEmbeddings(movieIds, 'movie');

        return results;
    } catch (error) {
        console.error('Error ensuring popular movies have embeddings:', error);
        throw error;
    }
}
