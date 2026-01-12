import axios from 'axios';

const OMDB_BASE_URL = 'http://www.omdbapi.com';
const OMDB_API_KEY = process.env.OMDB_API_KEY;

// Get IMDb rating and details by IMDb ID
export const getIMDbRating = async (imdbId) => {
    if (!imdbId) return null;

    try {
        const response = await axios.get(OMDB_BASE_URL, {
            params: {
                i: imdbId,
                apikey: OMDB_API_KEY,
                plot: 'short'
            },
            timeout: 5000
        });

        if (response.data.Response === 'True') {
            return {
                imdbRating: parseFloat(response.data.imdbRating) || null,
                imdbVotes: response.data.imdbVotes ? parseInt(response.data.imdbVotes.replace(/,/g, '')) : null,
                metascore: response.data.Metascore !== 'N/A' ? parseInt(response.data.Metascore) : null,
                awards: response.data.Awards !== 'N/A' ? response.data.Awards : null
            };
        }
        return null;
    } catch (error) {
        console.error(`OMDb API error for ${imdbId}:`, error.message);
        return null;
    }
};

// Enrich an array of movies/shows with IMDb ratings
export const enrichWithIMDb = async (items) => {
    const enrichedItems = await Promise.all(
        items.map(async (item) => {
            if (item.imdbId) {
                const imdbData = await getIMDbRating(item.imdbId);
                if (imdbData) {
                    return { ...item, ...imdbData };
                }
            }
            return item;
        })
    );
    return enrichedItems;
};

// Batch enrich with rate limiting (to avoid hitting API limits)
export const enrichWithIMDbBatch = async (items, batchSize = 5) => {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const enrichedBatch = await Promise.all(
            batch.map(async (item) => {
                if (item.imdbId) {
                    const imdbData = await getIMDbRating(item.imdbId);
                    if (imdbData) {
                        return { ...item, ...imdbData };
                    }
                }
                return item;
            })
        );
        results.push(...enrichedBatch);

        // Small delay between batches to respect rate limits
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results;
};
