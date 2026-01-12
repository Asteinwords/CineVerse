import axios from 'axios';
import { generateEmbedding, generateMovieVibeDescription, calculateCosineSimilarity } from './vibeService.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Retry helper with exponential backoff
 */
async function retryRequest(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            const delay = Math.min(1000 * Math.pow(2, i), 5000);
            console.log(`⚠️  Retry ${i + 1}/${retries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Search TMDB and generate embeddings on-the-fly for 100% real-time results
 */
export async function searchTMDBWithVibes(description, options = {}) {
    const {
        limit = 20,
        type = 'movie'
    } = options;

    const TMDB_KEY = process.env.TMDB_API_KEY;

    try {
        console.log(`🔍 Real-time TMDB search: "${description}"`);

        const keywords = extractKeywords(description);
        const searchQuery = keywords.join(' ');
        const discoverEndpoint = type === 'tv' ? 'discover/tv' : 'discover/movie';

        // Fetch with retry logic
        const page1 = await retryRequest(() => axios.get(`${TMDB_BASE_URL}/${discoverEndpoint}`, {
            params: {
                api_key: TMDB_KEY,
                sort_by: 'popularity.desc',
                'vote_count.gte': 50,
                page: 1
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 300));

        const page2 = await retryRequest(() => axios.get(`${TMDB_BASE_URL}/${discoverEndpoint}`, {
            params: {
                api_key: TMDB_KEY,
                sort_by: 'vote_average.desc',
                'vote_count.gte': 100,
                page: 1
            }
        }));

        let movies = [
            ...(page1.data.results || []),
            ...(page2.data.results || [])
        ];

        // Keyword search with retry
        if (searchQuery.length > 3) {
            await new Promise(resolve => setTimeout(resolve, 300));

            const searchEndpoint = type === 'tv' ? 'search/tv' : 'search/movie';
            const search1 = await retryRequest(() => axios.get(`${TMDB_BASE_URL}/${searchEndpoint}`, {
                params: {
                    api_key: TMDB_KEY,
                    query: searchQuery,
                    page: 1
                }
            }));

            const searchResults = search1.data.results || [];
            movies = [...searchResults, ...movies];
        }

        // Remove duplicates
        const uniqueMovies = [];
        const seenIds = new Set();
        for (const movie of movies) {
            if (!seenIds.has(movie.id) && movie.vote_count > 10 && movie.overview) {
                seenIds.add(movie.id);
                uniqueMovies.push(movie);
            }
        }

        // Process top 20 for faster results
        const moviesToProcess = uniqueMovies.slice(0, 20);
        console.log(`📊 Processing ${moviesToProcess.length} real TMDB movies...`);

        const queryEmbedding = await generateEmbedding(description);

        // Small batches
        const scoredMovies = [];
        const batchSize = 3;

        for (let i = 0; i < moviesToProcess.length; i += batchSize) {
            const batch = moviesToProcess.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async (movie) => {
                    try {
                        const movieType = type === 'tv' ? 'tv' : 'movie';
                        const detailsResponse = await retryRequest(() => axios.get(`${TMDB_BASE_URL}/${movieType}/${movie.id}`, {
                            params: {
                                api_key: TMDB_KEY,
                                append_to_response: 'keywords'
                            }
                        }));

                        const data = detailsResponse.data;
                        const keywords = data.keywords?.[movieType === 'tv' ? 'results' : 'keywords'] || [];

                        const movieData = {
                            title: data.title || data.name,
                            overview: data.overview,
                            genres: data.genres?.map(g => g.name) || [],
                            keywords: keywords.map(k => k.name)
                        };

                        const vibeDescription = await generateMovieVibeDescription(movieData);
                        const movieEmbedding = await generateEmbedding(vibeDescription);
                        const similarityScore = calculateCosineSimilarity(queryEmbedding, movieEmbedding);

                        return {
                            id: data.id,
                            title: movieData.title,
                            poster: data.poster_path,
                            backdrop: data.backdrop_path,
                            overview: data.overview,
                            rating: data.vote_average,
                            releaseDate: data.release_date || data.first_air_date,
                            type: type,
                            genres: movieData.genres,
                            vibeDescription,
                            similarityScore
                        };
                    } catch (error) {
                        console.error(`Error processing movie ${movie.id}:`, error.message);
                        return null;
                    }
                })
            );

            scoredMovies.push(...batchResults.filter(m => m !== null));

            if (i + batchSize < moviesToProcess.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        scoredMovies.sort((a, b) => b.similarityScore - a.similarityScore);

        console.log(`✅ Found ${scoredMovies.length} genuine TMDB matches`);

        return scoredMovies.slice(0, limit);

    } catch (error) {
        console.error('TMDB vibe search error:', error);
        throw error;
    }
}

/**
 * Search TMDB for exact movie title match
 */
export async function searchTMDBByTitle(title, year = null, type = 'movie') {
    const TMDB_KEY = process.env.TMDB_API_KEY;

    try {
        console.log(`🔍 Searching TMDB for exact match: "${title}" (${year || 'any year'})`);

        const searchEndpoint = type === 'tv' ? 'search/tv' : 'search/movie';

        const response = await retryRequest(() => axios.get(`${TMDB_BASE_URL}/${searchEndpoint}`, {
            params: {
                api_key: TMDB_KEY,
                query: title,
                year: year || undefined,
                page: 1
            }
        }));

        const results = response.data.results || [];

        if (results.length === 0) {
            console.log(`⚠️  No exact match found for "${title}"`);
            return null;
        }

        // Get the first result (most relevant)
        const movie = results[0];

        // Fetch detailed information
        await new Promise(resolve => setTimeout(resolve, 300));

        const movieType = type === 'tv' ? 'tv' : 'movie';
        const detailsResponse = await retryRequest(() => axios.get(`${TMDB_BASE_URL}/${movieType}/${movie.id}`, {
            params: {
                api_key: TMDB_KEY,
                append_to_response: 'credits,keywords,videos'
            }
        }));

        const data = detailsResponse.data;
        const keywords = data.keywords?.[movieType === 'tv' ? 'results' : 'keywords'] || [];

        console.log(`✅ Found exact match: ${data.title || data.name} (${data.release_date || data.first_air_date})`);

        return {
            id: data.id,
            title: data.title || data.name,
            poster: data.poster_path,
            backdrop: data.backdrop_path,
            overview: data.overview,
            rating: data.vote_average,
            releaseDate: data.release_date || data.first_air_date,
            type: type,
            genres: data.genres?.map(g => g.name) || [],
            keywords: keywords.map(k => k.name),
            cast: data.credits?.cast?.slice(0, 10).map(c => ({
                name: c.name,
                character: c.character,
                profile: c.profile_path
            })) || [],
            director: data.credits?.crew?.find(c => c.job === 'Director')?.name || null,
            runtime: data.runtime || data.episode_run_time?.[0] || null,
            tagline: data.tagline || null
        };

    } catch (error) {
        console.error('TMDB exact search error:', error.message);
        return null;
    }
}

function extractKeywords(description) {
    const lowerDesc = description.toLowerCase();

    const vibeKeywords = {
        'dark': ['thriller', 'horror', 'noir'],
        'scary': ['horror', 'thriller'],
        'funny': ['comedy'],
        'romantic': ['romance'],
        'action': ['action', 'adventure'],
        'mysterious': ['mystery', 'thriller'],
        'cyberpunk': ['science fiction'],
        'space': ['science fiction', 'space'],
        'war': ['war'],
        'crime': ['crime', 'thriller'],
        'family': ['family'],
        'fantasy': ['fantasy'],
        'drama': ['drama'],
        'epic': ['adventure'],
        'psychological': ['thriller']
    };

    const keywords = [];

    for (const [vibe, themes] of Object.entries(vibeKeywords)) {
        if (lowerDesc.includes(vibe)) {
            keywords.push(...themes);
        }
    }

    const words = description.split(' ').filter(w => w.length > 3);
    keywords.push(...words.slice(0, 5));

    return [...new Set(keywords)];
}
