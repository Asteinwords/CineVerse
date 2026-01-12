import express from 'express';
import axios from 'axios';

const router = express.Router();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const VIBE_KEYWORDS = {
  emotional: ['emotional', 'heartfelt', 'touching', 'moving', 'passionate'],
  wholesome: ['wholesome', 'feel-good', 'uplifting', 'inspiring', 'heartwarming'],
  dark: ['dark', 'gloomy', 'bleak', 'noir', 'sinister'],
  energetic: ['fast-paced', 'energetic', 'intense', 'dynamic', 'thrilling'],
  suspenseful: ['suspenseful', 'tense', 'thrilling', 'suspense', 'mystery'],
  nostalgic: ['nostalgic', 'retro', 'vintage', 'classic', 'timeless'],
  romantic: ['romantic', 'romance', 'love', 'passionate', 'intimate'],
  violent: ['violent', 'brutal', 'gory', 'action-packed', 'combat'],
  familyFriendly: ['family-friendly', 'wholesome', 'kids', 'children', 'animated'],
  epic: ['epic', 'grand', 'sweeping', 'monumental', 'legendary'],
  calm: ['calm', 'peaceful', 'serene', 'meditative', 'quiet'],
  funny: ['funny', 'comedy', 'humorous', 'comedic', 'witty'],
  sad: ['sad', 'tragic', 'melancholic', 'sorrowful', 'depressing'],
  psychological: ['psychological', 'mind-bending', 'introspective', 'cerebral', 'philosophical']
};

const COUNTRY_LANGUAGE_MAP = {
  'in': 'Hindi',      // India (Bollywood)
  'IN': 'Hindi',
  'ta': 'Tamil',      // Tamil Nadu
  'TA': 'Tamil',
  'te': 'Telugu',     // Telangana
  'TE': 'Telugu',
  'kn': 'Kannada',    // Karnataka
  'KN': 'Kannada',
  'ml': 'Malayalam',  // Kerala
  'ML': 'Malayalam',
  'kr': 'Korean',     // South Korea
  'KR': 'Korean',
  'ja': 'Japanese',   // Japan
  'JA': 'Japanese',
  'zh': 'Chinese',    // China
  'ZH': 'Chinese',
  'us': 'English',    // USA/Hollywood
  'US': 'English',
  'gb': 'English'     // UK
};

const extractVibes = (movie, allGenres = {}) => {
  const vibes = {};
  const keywords = (movie.keywords || []).map(k => typeof k === 'string' ? k.toLowerCase() : k.name.toLowerCase());
  const genreNames = (movie.genres || []).map(g => typeof g === 'string' ? g.toLowerCase() : g.name.toLowerCase());

  for (const [vibe, vibePhrases] of Object.entries(VIBE_KEYWORDS)) {
    let score = 0;
    vibePhrases.forEach(phrase => {
      if (keywords.some(k => k.includes(phrase.toLowerCase())) ||
        genreNames.some(g => g.includes(phrase.toLowerCase()))) {
        score += 1;
      }
    });
    vibes[vibe] = score;
  }

  return vibes;
};

const calculateVibeSimilarity = (movie1Vibes, movie2Vibes) => {
  let totalDiff = 0;
  let count = 0;

  for (const vibe in movie1Vibes) {
    if (movie2Vibes[vibe] !== undefined) {
      totalDiff += Math.abs(movie1Vibes[vibe] - movie2Vibes[vibe]);
      count++;
    }
  }

  return count > 0 ? 1 - (totalDiff / (count * 5)) : 0.5;
};

const calculateComprehensiveSimilarityScore = (primaryMovie, compareMovie, primaryVibes, compareVibes) => {
  let score = 0;

  // Genre overlap (0.25 weight)
  const primaryGenreIds = new Set((primaryMovie.genres || []).map(g => typeof g === 'object' ? g.id : g));
  const compareGenreIds = new Set((compareMovie.genres || []).map(g => typeof g === 'object' ? g.id : g));
  const genreOverlap = Array.from(primaryGenreIds).filter(g => compareGenreIds.has(g)).length;
  const maxGenres = Math.max(primaryGenreIds.size, compareGenreIds.size) || 1;
  const genreScore = genreOverlap / maxGenres;
  score += genreScore * 0.25;

  // Keyword similarity (0.25 weight)
  const primaryKeywords = new Set((primaryMovie.keywords || []).map(k => typeof k === 'string' ? k.toLowerCase() : k.name.toLowerCase()));
  const compareKeywords = new Set((compareMovie.keywords || []).map(k => typeof k === 'string' ? k.toLowerCase() : k.name.toLowerCase()));
  const keywordOverlap = Array.from(primaryKeywords).filter(k => compareKeywords.has(k)).length;
  const maxKeywords = Math.max(primaryKeywords.size, compareKeywords.size) || 1;
  const keywordScore = keywordOverlap / maxKeywords;
  score += keywordScore * 0.25;

  // Cast similarity (0.15 weight)
  const primaryCastIds = new Set((primaryMovie.cast || []).map(c => c.id));
  const compareCastIds = new Set((compareMovie.cast || []).map(c => c.id));
  const castOverlap = Array.from(primaryCastIds).filter(c => compareCastIds.has(c)).length;
  const maxCast = Math.max(primaryCastIds.size, compareCastIds.size) || 1;
  const castScore = castOverlap / maxCast;
  score += castScore * 0.15;

  // Tone similarity based on rating (0.15 weight)
  const ratingDiff = Math.abs((primaryMovie.rating || 6) - (compareMovie.rating || 6)) / 10;
  const toneScore = 1 - ratingDiff;
  score += toneScore * 0.15;

  // Vibe similarity (0.20 weight) - major weight on emotional/thematic alignment
  const vibeScore = calculateVibeSimilarity(primaryVibes, compareVibes);
  score += vibeScore * 0.20;

  return score;
};

const fetchGlobalMovies = async (query, type = 'movie', TMDB_KEY) => {
  const allResults = [];

  // Search in multiple languages and regions
  const searchConfigs = [
    { language: 'en', region: 'US' },  // Hollywood
    { language: 'hi', region: 'IN' },  // Bollywood
    { language: 'ta', region: 'IN' },  // Tamil
    { language: 'te', region: 'IN' },  // Telugu
    { language: 'kn', region: 'IN' },  // Kannada
    { language: 'ml', region: 'IN' },  // Malayalam
    { language: 'ko', region: 'KR' },  // Korean
    { language: 'ja', region: 'JP' },  // Japanese
    { language: 'zh', region: 'CN' },  // Chinese
  ];

  const endpoint = `${TMDB_BASE_URL}/search/${type === 'anime' ? 'tv' : type}`;

  for (const config of searchConfigs) {
    try {
      const response = await axios.get(endpoint, {
        params: {
          api_key: TMDB_KEY,
          query,
          language: config.language,
          region: config.region,
          page: 1,
          include_adult: false
        },
        timeout: 5000
      });

      const results = response.data.results || [];

      // For anime, also fetch from tv endpoint with specific filters
      if (type === 'anime' && config.language === 'ja') {
        results.forEach(item => {
          if (!allResults.find(r => r.id === item.id)) {
            allResults.push({ ...item, mediaType: 'anime' });
          }
        });
      } else {
        results.forEach(item => {
          if (!allResults.find(r => r.id === item.id)) {
            allResults.push({ ...item, mediaType: type });
          }
        });
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${config.language} results:`, error.message);
    }
  }

  return allResults;
};

// Search movies by name with global vibe-based similarity engine
router.get('/search', async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { query, type = 'movie' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const primaryResults = await fetchGlobalMovies(query, type, TMDB_KEY);

    if (primaryResults.length === 0) {
      return res.json([]);
    }

    // Get the top primary match
    const primaryMovie = primaryResults[0];
    const movieType = type === 'anime' ? 'tv' : type;

    let primaryMovieDetails = {};
    let primaryVibes = {};

    try {
      const detailsResponse = await axios.get(`${TMDB_BASE_URL}/${movieType}/${primaryMovie.id}`, {
        params: {
          api_key: TMDB_KEY,
          append_to_response: 'credits,keywords',
          language: 'en'
        }
      });

      const data = detailsResponse.data;
      primaryMovieDetails = {
        id: data.id,
        title: data.title || data.name,
        genres: data.genres || [],
        cast: data.credits?.cast?.slice(0, 10) || [],
        keywords: data.keywords?.[movieType === 'tv' ? 'results' : 'keywords'] || [],
        rating: data.vote_average,
        runtime: data.runtime || data.episode_run_time?.[0] || 0,
        overview: data.overview,
        poster: data.poster_path,
        releaseDate: data.release_date || data.first_air_date
      };

      primaryVibes = extractVibes(primaryMovieDetails);
    } catch (error) {
      console.error('Error fetching primary movie details:', error.message);
    }

    let similarMovies = [];
    let recommendedMovies = [];

    try {
      const similarResponse = await axios.get(`${TMDB_BASE_URL}/${movieType}/${primaryMovie.id}/similar`, {
        params: {
          api_key: TMDB_KEY,
          page: 1,
          language: 'en'
        }
      });
      similarMovies = similarResponse.data.results || [];
    } catch (error) {
      console.error('Error fetching similar movies:', error.message);
    }

    try {
      const recommendedResponse = await axios.get(`${TMDB_BASE_URL}/${movieType}/${primaryMovie.id}/recommendations`, {
        params: {
          api_key: TMDB_KEY,
          page: 1,
          language: 'en'
        }
      });
      recommendedMovies = recommendedResponse.data.results || [];
    } catch (error) {
      console.error('Error fetching recommended movies:', error.message);
    }

    // Combine and deduplicate
    const combinedMovies = [...similarMovies, ...recommendedMovies];
    const uniqueMovieIds = new Set();
    const deduplicatedMovies = [];

    for (const movie of combinedMovies) {
      if (!uniqueMovieIds.has(movie.id)) {
        uniqueMovieIds.add(movie.id);
        deduplicatedMovies.push(movie);
      }
    }

    const scoredMovies = [];

    for (const movie of deduplicatedMovies.slice(0, 30)) {
      try {
        const detailsResponse = await axios.get(`${TMDB_BASE_URL}/${movieType}/${movie.id}`, {
          params: {
            api_key: TMDB_KEY,
            append_to_response: 'credits,keywords',
            language: 'en'
          }
        });

        const data = detailsResponse.data;
        const movieDetails = {
          genres: data.genres || [],
          cast: data.credits?.cast?.slice(0, 10) || [],
          keywords: data.keywords?.[movieType === 'tv' ? 'results' : 'keywords'] || [],
          rating: data.vote_average,
          runtime: data.runtime || data.episode_run_time?.[0] || 0
        };

        const movieVibes = extractVibes(movieDetails);
        const similarityScore = calculateComprehensiveSimilarityScore(primaryMovieDetails, movieDetails, primaryVibes, movieVibes);

        scoredMovies.push({
          id: movie.id,
          title: movie.title || movie.name,
          poster: movie.poster_path,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date || movie.first_air_date,
          type: type === 'anime' ? 'anime' : type,
          similarityScore
        });
      } catch (error) {
        console.error(`Error fetching details for movie ${movie.id}:`, error.message);
      }
    }

    scoredMovies.sort((a, b) => b.similarityScore - a.similarityScore);

    res.json(scoredMovies.slice(0, 20));
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Mood-based search with real TMDB data
router.get('/mood-search', async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { mood, type = 'movie' } = req.query;

    if (!mood) {
      return res.status(400).json({ error: 'Mood parameter required' });
    }

    // Map moods to TMDB genres and keywords
    const moodConfig = {
      'scary': {
        genres: '27,53', // Horror, Thriller
        keywords: 'horror,supernatural,ghost,zombie,monster',
        sort: 'popularity.desc'
      },
      'nostalgic': {
        genres: '18,10751', // Drama, Family
        keywords: 'nostalgia,childhood,memories,classic,retro',
        sort: 'vote_average.desc',
        minVotes: 100
      },
      'relaxed': {
        genres: '35,10749,10751', // Comedy, Romance, Family
        keywords: 'feel-good,heartwarming,peaceful,light,uplifting',
        sort: 'popularity.desc'
      },
      'excited': {
        genres: '28,12,53', // Action, Adventure, Thriller
        keywords: 'intense,adrenaline,fast-paced,explosive,thrilling',
        sort: 'popularity.desc'
      },
      'happy': {
        genres: '35,16,10751', // Comedy, Animation, Family
        keywords: 'uplifting,cheerful,fun,joyful,happy',
        sort: 'popularity.desc'
      },
      'sad': {
        genres: '18,10749', // Drama, Romance
        keywords: 'emotional,tearjerker,tragic,melancholic,heartbreaking',
        sort: 'vote_average.desc',
        minVotes: 50
      },
      'angry': {
        genres: '28,80,53', // Action, Crime, Thriller
        keywords: 'revenge,justice,intense,violent,gritty',
        sort: 'popularity.desc'
      },
      'inspired': {
        genres: '99,18', // Documentary, Drama
        keywords: 'inspirational,motivational,true-story,biographical,uplifting',
        sort: 'vote_average.desc',
        minVotes: 50
      }
    };

    const config = moodConfig[mood.toLowerCase()];

    if (!config) {
      return res.status(400).json({ error: 'Invalid mood' });
    }

    const discoverEndpoint = type === 'tv' ? 'discover/tv' : 'discover/movie';

    // Fetch movies/shows based on mood
    const response = await axios.get(`${TMDB_BASE_URL}/${discoverEndpoint}`, {
      params: {
        api_key: TMDB_KEY,
        with_genres: config.genres,
        sort_by: config.sort,
        'vote_count.gte': config.minVotes || 20,
        page: 1,
        language: 'en-US'
      }
    });

    const results = response.data.results.slice(0, 20).map(item => ({
      id: item.id,
      title: item.title || item.name,
      poster: item.poster_path,
      overview: item.overview,
      rating: item.vote_average,
      releaseDate: item.release_date || item.first_air_date,
      type: type === 'tv' ? 'series' : 'movie'
    }));

    res.json(results);
  } catch (error) {
    console.error('Mood search error:', error);
    res.status(500).json({ error: 'Failed to search by mood' });
  }
});

// Get movie details
router.get('/:id', async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { id } = req.params;
    const { type = 'movie' } = req.query;

    const response = await axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
      params: {
        api_key: TMDB_KEY,
        append_to_response: 'credits,reviews,external_ids,watch/providers,keywords'
      }
    });

    const data = response.data;

    // Extract watch providers
    const watchProviders = data['watch/providers']?.results || {};

    // Extract directors
    const directors = data.credits?.crew?.filter(person => person.job === 'Director') || [];

    // Extract keywords
    const keywords = data.keywords?.[type === 'tv' ? 'results' : 'keywords'] || [];

    res.json({
      id: data.id,
      title: data.title || data.name,
      poster: data.poster_path,
      backdrop: data.backdrop_path,
      overview: data.overview,
      rating: data.vote_average,
      releaseDate: data.release_date || data.first_air_date,
      runtime: data.runtime || data.episode_run_time?.[0],
      genres: data.genres,
      cast: data.credits?.cast?.slice(0, 15) || [], // Increased to 15
      crew: data.credits?.crew?.slice(0, 10) || [], // Added crew
      directors: directors,
      productionCompanies: data.production_companies || [],
      originCountry: data.origin_country || [],
      spokenLanguages: data.spoken_languages || [],
      keywords: keywords,
      reviews: data.reviews?.results || [],
      externalIds: data.external_ids || {},
      watchProviders: watchProviders,
      status: data.status
    });
  } catch (error) {
    console.error('Details error:', error);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// Get cast info
router.get('/cast/:personId', async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { personId } = req.params;

    const response = await axios.get(`${TMDB_BASE_URL}/person/${personId}`, {
      params: {
        api_key: TMDB_KEY,
        append_to_response: 'movie_credits,tv_credits,external_ids'
      }
    });

    const data = response.data;

    res.json({
      id: data.id,
      name: data.name,
      biography: data.biography,
      profileImage: data.profile_path,
      birthday: data.birthday,
      placeOfBirth: data.place_of_birth,
      popularity: data.popularity,
      movieCredits: data.movie_credits?.cast || [],
      tvCredits: data.tv_credits?.cast || [],
      externalIds: data.external_ids || {}
    });
  } catch (error) {
    console.error('Cast error:', error);
    res.status(500).json({ error: 'Failed to fetch cast info' });
  }
});

// Get AI-generated review summary
router.get('/:id/review-summary', async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { id } = req.params;
    const { type = 'movie' } = req.query;

    const response = await axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
      params: {
        api_key: TMDB_KEY,
        append_to_response: 'reviews'
      }
    });

    const reviews = response.data.reviews?.results || [];

    // Generate AI summary from reviews (mock implementation)
    let summary = '';

    if (reviews.length === 0) {
      summary = 'No reviews available yet. Be the first to share your thoughts!';
    } else {
      const sentimentKeywords = {
        positive: ['amazing', 'excellent', 'great', 'love', 'fantastic', 'wonderful', 'masterpiece'],
        negative: ['bad', 'terrible', 'awful', 'hate', 'disappointing', 'poor', 'waste'],
        neutral: ['good', 'okay', 'decent', 'average', 'fine']
      };

      let positiveCount = 0;
      let negativeCount = 0;

      reviews.forEach(review => {
        const content = review.content.toLowerCase();
        sentimentKeywords.positive.forEach(word => {
          if (content.includes(word)) positiveCount++;
        });
        sentimentKeywords.negative.forEach(word => {
          if (content.includes(word)) negativeCount++;
        });
      });

      const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
        : 0;

      if (positiveCount > negativeCount) {
        summary = `This title has received predominantly positive reviews. Viewers praise its storytelling and production quality. Average rating from critics: ${averageRating}/10.`;
      } else if (negativeCount > positiveCount) {
        summary = `This title has received mixed to negative reviews from critics. While some appreciate the effort, many found it lacking in certain areas. Average rating: ${averageRating}/10.`;
      } else {
        summary = `This title has received mixed reviews from the community. Opinions vary, but it has its dedicated audience. Average rating: ${averageRating}/10.`;
      }
    }

    res.json({
      summary,
      reviewCount: reviews.length,
      sampleReviews: reviews.slice(0, 3)
    });
  } catch (error) {
    console.error('Review summary error:', error);
    res.status(500).json({ error: 'Failed to generate review summary' });
  }
});

export default router;
