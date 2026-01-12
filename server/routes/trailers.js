import express from 'express';
import axios from 'axios';

const router = express.Router();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get trailer for a movie or TV show
router.get('/:id', async (req, res) => {
    try {
        const TMDB_KEY = process.env.TMDB_API_KEY;
        const { id } = req.params;
        const { type = 'movie' } = req.query; // 'movie' or 'series'

        // Determine the correct endpoint based on type
        const endpoint = type === 'series' ? 'tv' : 'movie';

        console.log(`Fetching trailers for ${type} ID: ${id}`);

        const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${id}/videos`, {
            params: {
                api_key: TMDB_KEY,
                language: 'en-US'
            },
            timeout: 10000
        });

        const videos = response.data.results || [];

        // Filter for official YouTube trailers
        const trailers = videos.filter(video =>
            video.site === 'YouTube' &&
            (video.type === 'Trailer' || video.type === 'Teaser')
        );

        // Sort by official status and type (Trailer > Teaser)
        const sortedTrailers = trailers.sort((a, b) => {
            if (a.official !== b.official) return b.official ? 1 : -1;
            if (a.type !== b.type) return a.type === 'Trailer' ? -1 : 1;
            return 0;
        });

        // Return the best trailer or first available
        const bestTrailer = sortedTrailers[0];

        if (!bestTrailer) {
            console.log(`No trailer found for ${type} ID: ${id}`);
            res.json({ trailer: null });
            return;
        }

        console.log(`Found trailer: ${bestTrailer.name} (${bestTrailer.key})`);

        res.json({
            trailer: {
                key: bestTrailer.key,
                name: bestTrailer.name,
                type: bestTrailer.type,
                official: bestTrailer.official,
                youtubeUrl: `https://www.youtube.com/watch?v=${bestTrailer.key}`,
                embedUrl: `https://www.youtube.com/embed/${bestTrailer.key}?autoplay=1`
            }
        });

    } catch (error) {
        console.error('Trailer fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch trailer', trailer: null });
    }
});

export default router;
