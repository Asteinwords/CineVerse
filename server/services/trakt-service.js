import axios from 'axios';

const TRAKT_BASE_URL = 'https://api.trakt.tv';
const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;

// Helper to make Trakt API requests
const traktRequest = async (endpoint, params = {}) => {
    try {
        const response = await axios.get(`${TRAKT_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': TRAKT_CLIENT_ID
            },
            params,
            timeout: 8000
        });
        return response.data;
    } catch (error) {
        console.error(`Trakt API error (${endpoint}):`, error.message);
        return [];
    }
};

// Get trending movies
export const getTrendingMovies = async (limit = 20) => {
    const data = await traktRequest('/movies/trending', { limit, extended: 'full' });
    return data.map(item => ({
        traktId: item.movie.ids.trakt,
        tmdbId: item.movie.ids.tmdb,
        imdbId: item.movie.ids.imdb,
        title: item.movie.title,
        year: item.movie.year,
        watchers: item.watchers,
        rating: item.movie.rating,
        votes: item.movie.votes
    }));
};

// Get trending TV shows
export const getTrendingShows = async (limit = 20) => {
    const data = await traktRequest('/shows/trending', { limit, extended: 'full' });
    return data.map(item => ({
        traktId: item.show.ids.trakt,
        tmdbId: item.show.ids.tmdb,
        imdbId: item.show.ids.imdb,
        title: item.show.title,
        year: item.show.year,
        watchers: item.watchers,
        rating: item.show.rating,
        votes: item.show.votes
    }));
};

// Get popular movies
export const getPopularMovies = async (limit = 20) => {
    const data = await traktRequest('/movies/popular', { limit, extended: 'full' });
    return data.map(item => ({
        traktId: item.ids.trakt,
        tmdbId: item.ids.tmdb,
        imdbId: item.ids.imdb,
        title: item.title,
        year: item.year,
        rating: item.rating,
        votes: item.votes
    }));
};

// Get popular TV shows
export const getPopularShows = async (limit = 20) => {
    const data = await traktRequest('/shows/popular', { limit, extended: 'full' });
    return data.map(item => ({
        traktId: item.ids.trakt,
        tmdbId: item.ids.tmdb,
        imdbId: item.ids.imdb,
        title: item.title,
        year: item.year,
        rating: item.rating,
        votes: item.votes
    }));
};
