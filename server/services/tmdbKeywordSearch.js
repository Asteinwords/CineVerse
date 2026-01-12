import axios from 'axios';
import natural from 'natural';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TfIdf = natural.TfIdf;

/**
 * Mood and vibe to TMDB genre mapping
 */
const MOOD_TO_GENRES = {
    // Emotional moods
    'happy': [35, 10751, 10749], // Comedy, Family, Romance
    'sad': [18, 10749], // Drama, Romance
    'scared': [27, 53], // Horror, Thriller
    'excited': [28, 12, 878], // Action, Adventure, Sci-Fi
    'relaxed': [10751, 16, 35], // Family, Animation, Comedy
    'tense': [53, 80, 9648], // Thriller, Crime, Mystery
    'romantic': [10749, 35, 18], // Romance, Comedy, Drama
    'nostalgic': [18, 36, 10751], // Drama, History, Family
    'inspired': [18, 36, 10752], // Drama, History, War
    'adventurous': [12, 28, 14], // Adventure, Action, Fantasy

    // Atmosphere/Vibe
    'dark': [27, 53, 80], // Horror, Thriller, Crime
    'light': [35, 10751, 16], // Comedy, Family, Animation
    'mysterious': [9648, 53, 878], // Mystery, Thriller, Sci-Fi
    'epic': [12, 14, 10752], // Adventure, Fantasy, War
    'intense': [28, 53, 18], // Action, Thriller, Drama
    'funny': [35], // Comedy
    'dramatic': [18], // Drama
    'thrilling': [53, 28, 80], // Thriller, Action, Crime
    'magical': [14, 16, 10751], // Fantasy, Animation, Family
    'gritty': [80, 53, 18], // Crime, Thriller, Drama

    // Themes
    'crime': [80, 53], // Crime, Thriller
    'war': [10752, 36], // War, History
    'space': [878, 12], // Sci-Fi, Adventure
    'fantasy': [14, 12], // Fantasy, Adventure
    'horror': [27], // Horror
    'action': [28, 12], // Action, Adventure
    'family': [10751, 16, 35], // Family, Animation, Comedy
    'psychological': [53, 18, 9648], // Thriller, Drama, Mystery
    'superhero': [28, 12, 14], // Action, Adventure, Fantasy
    'western': [37], // Western
    'historical': [36, 10752], // History, War
    'documentary': [99], // Documentary
    'music': [10402], // Music
    'animation': [16], // Animation
};

/**
 * Keyword to genre mapping for more specific terms
 */
const KEYWORD_HINTS = {
    'zombie': [27, 53], // Horror, Thriller
    'vampire': [27, 14], // Horror, Fantasy
    'detective': [9648, 80, 53], // Mystery, Crime, Thriller
    'heist': [80, 53, 28], // Crime, Thriller, Action
    'spy': [28, 53, 12], // Action, Thriller, Adventure
    'alien': [878, 27, 12], // Sci-Fi, Horror, Adventure
    'robot': [878, 28], // Sci-Fi, Action
    'time travel': [878, 12, 14], // Sci-Fi, Adventure, Fantasy
    'dystopian': [878, 18, 53], // Sci-Fi, Drama, Thriller
    'cyberpunk': [878, 28, 53], // Sci-Fi, Action, Thriller
    'medieval': [14, 12, 36], // Fantasy, Adventure, History
    'pirate': [12, 28, 14], // Adventure, Action, Fantasy
    'monster': [27, 878, 28], // Horror, Sci-Fi, Action
    'ghost': [27, 9648], // Horror, Mystery
    'serial killer': [53, 80, 27], // Thriller, Crime, Horror
    'apocalypse': [878, 28, 18], // Sci-Fi, Action, Drama
    'survival': [28, 53, 18], // Action, Thriller, Drama
    'revenge': [28, 53, 18], // Action, Thriller, Drama
    'coming of age': [18, 35, 10749], // Drama, Comedy, Romance
    'sports': [18], // Drama
    'martial arts': [28], // Action
    'mafia': [80, 18], // Crime, Drama
    'prison': [18, 53, 80], // Drama, Thriller, Crime
    'school': [18, 35, 10749], // Drama, Comedy, Romance
    'college': [35, 18, 10749], // Comedy, Drama, Romance
};

/**
 * Extract keywords from description using TF-IDF
 */
function extractKeywordsWithTFIDF(description) {
    const tfidf = new TfIdf();
    tfidf.addDocument(description.toLowerCase());

    const keywords = [];
    tfidf.listTerms(0).forEach(item => {
        if (item.term.length > 2) { // Ignore very short words
            keywords.push(item.term);
        }
    });

    return keywords.slice(0, 10); // Top 10 keywords
}

/**
 * Map mood/vibe description to TMDB genre IDs
 */
function mapDescriptionToGenres(description) {
    const lowerDesc = description.toLowerCase();
    const genreIds = new Set();

    // Check mood mappings
    for (const [mood, genres] of Object.entries(MOOD_TO_GENRES)) {
        if (lowerDesc.includes(mood)) {
            genres.forEach(id => genreIds.add(id));
        }
    }

    // Check keyword hints
    for (const [keyword, genres] of Object.entries(KEYWORD_HINTS)) {
        if (lowerDesc.includes(keyword)) {
            genres.forEach(id => genreIds.add(id));
        }
    }

    return Array.from(genreIds);
}

/**
 * Extract year range from description
 */
function extractYearRange(description) {
    const yearMatch = description.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
        return { year: parseInt(yearMatch[1]) };
    }

    // Decade references
    if (description.match(/\b(80s|eighties)\b/i)) {
        return { 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '1989-12-31' };
    }
    if (description.match(/\b(90s|nineties)\b/i)) {
        return { 'primary_release_date.gte': '1990-01-01', 'primary_release_date.lte': '1999-12-31' };
    }
    if (description.match(/\b(2000s)\b/i)) {
        return { 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31' };
    }

    // Classic/old movies
    if (description.match(/\b(classic|old|vintage)\b/i)) {
        return { 'primary_release_date.lte': '1990-12-31' };
    }

    // Recent/new movies
    if (description.match(/\b(recent|new|latest|modern)\b/i)) {
        const currentYear = new Date().getFullYear();
        return { 'primary_release_date.gte': `${currentYear - 3}-01-01` };
    }

    return {};
}

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
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Search TMDB using keyword-based matching (no AI required)
 */
export async function searchByDescription(description, options = {}) {
    const {
        limit = 20,
        type = 'movie'
    } = options;

    const TMDB_KEY = process.env.TMDB_API_KEY;

    try {
        console.log(`🔍 Keyword-based search: "${description}"`);

        // Extract information from description
        const keywords = extractKeywordsWithTFIDF(description);
        const genreIds = mapDescriptionToGenres(description);
        const yearFilters = extractYearRange(description);

        console.log(`📊 Extracted: ${keywords.length} keywords, ${genreIds.length} genres`);

        const endpoint = type === 'tv' ? 'discover/tv' : 'discover/movie';
        const allResults = [];

        // Strategy 1: Genre-based discovery with keywords
        if (genreIds.length > 0) {
            const genreParams = {
                api_key: TMDB_KEY,
                with_genres: genreIds.slice(0, 3).join(','), // Max 3 genres for better results
                sort_by: 'popularity.desc',
                'vote_count.gte': 50,
                ...yearFilters,
                page: 1
            };

            const genreResponse = await retryRequest(() =>
                axios.get(`${TMDB_BASE_URL}/${endpoint}`, { params: genreParams })
            );

            allResults.push(...(genreResponse.data.results || []));
        }

        // Strategy 2: Keyword search
        if (keywords.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));

            const searchEndpoint = type === 'tv' ? 'search/tv' : 'search/movie';
            const searchQuery = keywords.slice(0, 5).join(' ');

            const searchResponse = await retryRequest(() =>
                axios.get(`${TMDB_BASE_URL}/${searchEndpoint}`, {
                    params: {
                        api_key: TMDB_KEY,
                        query: searchQuery,
                        page: 1
                    }
                })
            );

            allResults.push(...(searchResponse.data.results || []));
        }

        // Strategy 3: High-rated movies if no specific criteria
        if (allResults.length < 10) {
            await new Promise(resolve => setTimeout(resolve, 300));

            const topRatedResponse = await retryRequest(() =>
                axios.get(`${TMDB_BASE_URL}/${endpoint}`, {
                    params: {
                        api_key: TMDB_KEY,
                        sort_by: 'vote_average.desc',
                        'vote_count.gte': 1000,
                        ...yearFilters,
                        page: 1
                    }
                })
            );

            allResults.push(...(topRatedResponse.data.results || []));
        }

        // Remove duplicates
        const uniqueMovies = [];
        const seenIds = new Set();

        for (const movie of allResults) {
            if (!seenIds.has(movie.id) && movie.overview) {
                seenIds.add(movie.id);
                uniqueMovies.push(movie);
            }
        }

        // Score and rank results
        const scoredResults = uniqueMovies.map(movie => {
            let score = 0;
            const movieText = `${movie.title || movie.name} ${movie.overview}`.toLowerCase();

            // Keyword matching score
            keywords.forEach(keyword => {
                if (movieText.includes(keyword)) {
                    score += 2;
                }
            });

            // Genre matching score
            if (movie.genre_ids) {
                genreIds.forEach(genreId => {
                    if (movie.genre_ids.includes(genreId)) {
                        score += 3;
                    }
                });
            }

            // Popularity boost
            score += (movie.popularity || 0) / 100;

            // Rating boost
            score += (movie.vote_average || 0) / 2;

            return {
                id: movie.id,
                title: movie.title || movie.name,
                poster: movie.poster_path,
                backdrop: movie.backdrop_path,
                overview: movie.overview,
                rating: movie.vote_average,
                releaseDate: movie.release_date || movie.first_air_date,
                type: type,
                matchScore: score,
                genres: movie.genre_ids || []
            };
        });

        // Sort by match score
        scoredResults.sort((a, b) => b.matchScore - a.matchScore);

        const finalResults = scoredResults.slice(0, limit);

        console.log(`✅ Found ${finalResults.length} keyword-matched results`);

        return finalResults;

    } catch (error) {
        console.error('Keyword search error:', error);
        throw error;
    }
}

/**
 * Search TMDB for exact movie title match
 */
export async function searchByTitle(title, year = null, type = 'movie') {
    const TMDB_KEY = process.env.TMDB_API_KEY;

    try {
        const searchEndpoint = type === 'tv' ? 'search/tv' : 'search/movie';

        const response = await retryRequest(() =>
            axios.get(`${TMDB_BASE_URL}/${searchEndpoint}`, {
                params: {
                    api_key: TMDB_KEY,
                    query: title,
                    year: year || undefined,
                    page: 1
                }
            })
        );

        const results = response.data.results || [];

        if (results.length === 0) {
            return null;
        }

        return {
            id: results[0].id,
            title: results[0].title || results[0].name,
            poster: results[0].poster_path,
            backdrop: results[0].backdrop_path,
            overview: results[0].overview,
            rating: results[0].vote_average,
            releaseDate: results[0].release_date || results[0].first_air_date,
            type: type
        };

    } catch (error) {
        console.error('Title search error:', error);
        return null;
    }
}
