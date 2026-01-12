import express from 'express';
import axios from 'axios';

const router = express.Router();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get cast details
router.get('/:personId', async (req, res) => {
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
      movieCredits: data.movie_credits?.cast?.slice(0, 20) || [],
      tvCredits: data.tv_credits?.cast?.slice(0, 20) || [],
      externalIds: data.external_ids || {}
    });
  } catch (error) {
    console.error('Cast error:', error);
    res.status(500).json({ error: 'Failed to fetch cast info' });
  }
});

export default router;
