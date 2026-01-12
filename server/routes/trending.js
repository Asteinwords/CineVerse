import express from 'express';
import axios from 'axios';
import * as traktService from '../services/trakt-service.js';
import * as omdbService from '../services/omdb-service.js';

const router = express.Router();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get trending movies by region
router.get('/movies', async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { region = 'IN' } = req.query;

    let results = [];

    // India-only approach - "Talk of the Town" (Daily Trends + Upcoming Buzz)
    if (region === 'IN') {
      const today = new Date();
      let allMovies = [];

      // 3-Pronged Approach for "Talk of the Town"
      try {
        console.log('Fetching India "Talk of the Town" data...');

        const [dailyTrending, upcoming, nowPlaying] = await Promise.all([
          // 1. Daily Viral Trends (Global -> Filter later)
          axios.get(`${TMDB_BASE_URL}/trending/movie/day`, {
            params: { api_key: TMDB_KEY },
            timeout: 15000
          }),
          // 2. Upcoming Buzz (Future releases)
          axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
            params: { api_key: TMDB_KEY, region: 'IN', page: 1 },
            timeout: 15000
          }),
          // 3. In Theaters Now (Fresh releases)
          axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
            params: { api_key: TMDB_KEY, region: 'IN', page: 1 },
            timeout: 15000
          })
        ]);

        // Combine all unique movies
        const uniqueMovies = new Map();

        const addMovies = (list, source) => {
          (list || []).forEach(movie => {
            if (!uniqueMovies.has(movie.id)) {
              uniqueMovies.set(movie.id, { ...movie, source });
            }
          });
        };

        addMovies(dailyTrending.data.results, 'trending');
        addMovies(upcoming.data.results, 'upcoming');
        addMovies(nowPlaying.data.results, 'now_playing');

        allMovies = Array.from(uniqueMovies.values());
        console.log(`Fetched ${allMovies.length} unique movies from all sources`);

      } catch (err) {
        console.error('Error fetching Talk of the Town:', err.message);
        // Fallback to simple popular
        try {
          const fallback = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
            params: { api_key: TMDB_KEY, region: 'IN', page: 1 },
            timeout: 15000
          });
          allMovies = fallback.data.results || [];
        } catch (e) {
          res.json([]);
          return;
        }
      }

      // Filter for Indian content only
      const indianOnlyMovies = allMovies.filter(movie => {
        const isIndianLanguage = movie.original_language &&
          ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'pa'].includes(movie.original_language);
        return isIndianLanguage;
      });

      console.log(`Filtered to ${indianOnlyMovies.length} Indian movies`);

      if (indianOnlyMovies.length === 0) {
        res.json([]);
        return;
      }

      // "Talk of the Town" Scoring Algorithm
      const scoredMovies = indianOnlyMovies.map(movie => {
        const releaseDate = movie.release_date ? new Date(movie.release_date) : new Date(0);
        const daysDiff = (releaseDate - today) / (1000 * 60 * 60 * 24); // Positive = Future, Negative = Past

        let score = 0;
        let status = '';

        // 1. Future Buzz (Upcoming) - Massive Boost
        if (daysDiff > 0) {
          // Upcoming movies get high priority (Talk of the Town)
          // Closer to release = higher score, but even far out gets a boost
          score = 1000 + (movie.popularity / 10);
          status = 'upcoming';
        }
        // 2. Fresh Releases (Last 3 months) - High Score
        else if (daysDiff > -90) {
          // Very recent releases (Talk of the Town)
          score = 500 + (movie.popularity / 5) + (100 / (Math.abs(daysDiff) + 1));
          status = 'fresh';
        }
        // 3. Older Movies - Strict Penalty
        else {
          // Only survive if they are VIRAL right now (in daily trending list)
          if (movie.source === 'trending') {
            score = 100 + (movie.popularity / 20); // Lower base score
            status = 'viral_old';
          } else {
            score = 0; // Kill older movies not currently trending
            status = 'dead';
          }
        }

        // Boost for high vote count (proven quality)
        if (movie.vote_count > 1000) score += 50;

        return { ...movie, score, status, daysDiff };
      });

      // Filter out 'dead' movies and sort
      results = scoredMovies
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      console.log('Top 5 Talk of the Town:', results.slice(0, 5).map(m => `${m.title} (${m.status})`));



    } else {
      // For other regions, use standard discover with language filtering
      const regionConfig = {
        'US': { with_original_language: 'en', region: 'US' },
        'JP': { with_original_language: 'ja', region: 'JP' },
        'KR': { with_original_language: 'ko', region: 'KR' },
        'GB': { with_original_language: 'en', region: 'GB' }
      };

      const config = regionConfig[region] || regionConfig['US'];

      const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          api_key: TMDB_KEY,
          ...config,
          sort_by: 'popularity.desc',
          page: 1,
          'vote_count.gte': 20,
          'primary_release_date.gte': '2020-01-01'
        }
      });

      results = response.data.results.slice(0, 20);
    }

    const formattedResults = results.map(item => ({
      id: item.id,
      title: item.title,
      poster: item.poster_path,
      overview: item.overview,
      rating: item.vote_average,
      imdbRating: item.imdbRating || null,
      imdbVotes: item.imdbVotes || null,
      metascore: item.metascore || null,
      traktWatchers: item.traktWatchers || null,
      releaseDate: item.release_date,
      type: 'movie'
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

// Get trending TV by region
router.get('/tv', async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { region = 'IN' } = req.query;

    let results = [];

    // India-only approach - ONLY Indian TV shows (IMDb-style)
    if (region === 'IN') {
      const today = new Date();
      const threeYearsAgo = new Date(today);
      threeYearsAgo.setFullYear(today.getFullYear() - 3);
      const formatDate = (date) => date.toISOString().split('T')[0];

      let allShows = [];

      // Fetch Indian content with improved error handling
      try {
        console.log('Fetching Indian trending TV shows...');
        const indianShows = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
          params: {
            api_key: TMDB_KEY,
            with_origin_country: 'IN',
            sort_by: 'popularity.desc',
            'vote_count.gte': 3,
            'first_air_date.gte': formatDate(threeYearsAgo),
            page: 1
          },
          timeout: 20000 // Increased timeout
        });
        allShows = indianShows.data.results || [];
        console.log(`Fetched ${allShows.length} Indian TV shows from TMDB`);
      } catch (err) {
        console.error('Error fetching Indian TV shows:', err.message);
        // Fallback: try trending TV and filter for Indian content
        try {
          console.log('Trying fallback with trending TV...');
          const trendingTV = await axios.get(`${TMDB_BASE_URL}/trending/tv/week`, {
            params: {
              api_key: TMDB_KEY
            },
            timeout: 20000
          });
          // Filter for Indian shows
          allShows = (trendingTV.data.results || []).filter(show =>
            show.origin_country && show.origin_country.includes('IN')
          );
          console.log(`Fallback fetched ${allShows.length} Indian TV shows from trending`);
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr.message);
          // Last resort: try popular TV
          try {
            console.log('Trying last resort with popular TV...');
            const popularTV = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
              params: {
                api_key: TMDB_KEY,
                page: 1
              },
              timeout: 20000
            });
            // Filter for Indian shows
            allShows = (popularTV.data.results || []).filter(show =>
              show.origin_country && show.origin_country.includes('IN')
            );
            console.log(`Last resort fetched ${allShows.length} Indian TV shows`);
          } catch (lastErr) {
            console.error('All attempts failed:', lastErr.message);
            allShows = [];
          }
        }
      }

      // If we still have no results, return empty array
      if (allShows.length === 0) {
        console.warn('No Indian TV shows found, returning empty array');
        res.json([]);
        return;
      }

      // STRICT India-only filter
      const indianOnlyShows = allShows.filter(show => {
        const isIndianLanguage = show.original_language &&
          ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'mr', 'pa'].includes(show.original_language);
        return isIndianLanguage;
      });

      // Enhanced scoring: recency + popularity + rating quality
      const scoredShows = indianOnlyShows.map(show => {
        // Calculate days since first air date
        const firstAirDate = new Date(show.first_air_date);
        const daysSinceAir = (today - firstAirDate) / (1000 * 60 * 60 * 24);

        // Recency score (newer = higher, decay over 3 years)
        const recencyScore = Math.max(0, 1 - (daysSinceAir / 1095)); // 1095 days = 3 years

        // Popularity score (normalized)
        const popularityScore = show.popularity / 100;

        // Rating quality score (vote_average * log of vote_count)
        const ratingScore = show.vote_average * Math.log10(show.vote_count + 1);

        // Combined score with weights
        const score = (recencyScore * 30) + (popularityScore * 40) + (ratingScore * 30);

        return { ...show, score, daysSinceAir };
      });

      // Sort by score and take top 20
      results = scoredShows
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);



    } else {
      // For other regions, use standard discover
      const regionConfig = {
        'US': { with_origin_country: 'US', with_original_language: 'en' },
        'JP': { with_origin_country: 'JP', with_original_language: 'ja' },
        'KR': { with_origin_country: 'KR', with_original_language: 'ko' },
        'GB': { with_origin_country: 'GB', with_original_language: 'en' }
      };

      const config = regionConfig[region] || regionConfig['US'];

      const response = await axios.get(`${TMDB_BASE_URL}/discover/tv`, {
        params: {
          api_key: TMDB_KEY,
          ...config,
          sort_by: 'popularity.desc',
          watch_region: region,
          page: 1,
          'vote_count.gte': 10,
          'first_air_date.gte': '2018-01-01'
        }
      });

      results = response.data.results.slice(0, 20);
    }

    const formattedResults = results.map(item => ({
      id: item.id,
      title: item.name,
      poster: item.poster_path,
      overview: item.overview,
      rating: item.vote_average,
      imdbRating: item.imdbRating || null,
      imdbVotes: item.imdbVotes || null,
      metascore: item.metascore || null,
      traktWatchers: item.traktWatchers || null,
      type: 'series'
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Trending TV error:', error);
    res.status(500).json({ error: 'Failed to fetch trending TV' });
  }
});

export default router;
