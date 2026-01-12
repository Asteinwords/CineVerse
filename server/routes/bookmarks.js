import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Bookmark from '../models/Bookmark.js';
import axios from 'axios';

const router = express.Router();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get user bookmarks
router.get('/', verifyToken, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.userId }).sort({ createdAt: -1 });

    // Fetch missing poster data from TMDB
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const enrichedBookmarks = await Promise.all(
      bookmarks.map(async (bookmark) => {
        // If poster is missing, fetch from TMDB
        if (!bookmark.moviePoster && TMDB_KEY) {
          try {
            const movieType = bookmark.movieType === 'anime' ? 'tv' : bookmark.movieType;
            const response = await axios.get(`${TMDB_BASE_URL}/${movieType}/${bookmark.movieId}`, {
              params: { api_key: TMDB_KEY }
            });

            // Update the bookmark with the poster
            if (response.data.poster_path) {
              bookmark.moviePoster = response.data.poster_path;
              await bookmark.save();
            }
          } catch (error) {
            console.error(`Error fetching poster for movie ${bookmark.movieId}:`, error.message);
          }
        }
        return bookmark;
      })
    );

    res.json(enrichedBookmarks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Add bookmark
router.post('/', verifyToken, async (req, res) => {
  try {
    const { movieId, movieTitle, moviePoster, movieType } = req.body;

    const existingBookmark = await Bookmark.findOne({
      userId: req.userId,
      movieId
    });

    if (existingBookmark) {
      return res.status(400).json({ error: 'Already bookmarked' });
    }

    const bookmark = new Bookmark({
      userId: req.userId,
      movieId,
      movieTitle,
      moviePoster,
      movieType: movieType || 'movie'
    });

    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

// Remove bookmark
router.delete('/:movieId', verifyToken, async (req, res) => {
  try {
    const { movieId } = req.params;

    await Bookmark.deleteOne({
      userId: req.userId,
      movieId: parseInt(movieId)
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// Check if movie is bookmarked
router.get('/check/:movieId', verifyToken, async (req, res) => {
  try {
    const { movieId } = req.params;

    const bookmark = await Bookmark.findOne({
      userId: req.userId,
      movieId: parseInt(movieId)
    });

    res.json({ isBookmarked: !!bookmark });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check bookmark' });
  }
});

export default router;
