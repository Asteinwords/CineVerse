import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import Discussion from '../models/Discussion.js';
import User from '../models/User.js';

const router = express.Router();

// Get discussions for a movie
router.get('/:movieId', async (req, res) => {
    try {
        const discussions = await Discussion.find({ movieId: req.params.movieId })
            .populate('userId', 'name picture')
            .populate('replies.userId', 'name picture')
            .sort({ createdAt: -1 }); // Newest first
        res.json(discussions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch discussions' });
    }
});

// Create a discussion
router.post('/', verifyToken, async (req, res) => {
    try {
        const { movieId, movieTitle, content } = req.body;

        console.log('Creating discussion:', { userId: req.userId, movieId, movieTitle, content: content?.substring(0, 50) });

        if (!movieId || !movieTitle || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const discussion = new Discussion({
            userId: req.userId,
            movieId: parseInt(movieId),
            movieTitle,
            content
        });

        await discussion.save();
        console.log('Discussion saved:', discussion._id);

        // Populate user info to return immediately
        await discussion.populate('userId', 'name picture');

        res.status(201).json(discussion);
    } catch (error) {
        console.error('Discussion creation error:', error);
        res.status(500).json({ error: 'Failed to create discussion: ' + error.message });
    }
});

// Toggle like
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        const likeIndex = discussion.likes.indexOf(req.userId);
        if (likeIndex > -1) {
            discussion.likes.splice(likeIndex, 1); // Unlike
        } else {
            discussion.likes.push(req.userId); // Like
        }

        await discussion.save();
        res.json({ likes: discussion.likes });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// Add reply
router.post('/:id/reply', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        const discussion = await Discussion.findById(req.params.id);

        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        discussion.replies.push({
            userId: req.userId,
            content
        });

        await discussion.save();

        // Re-fetch to populate user info for the new reply
        const updatedDiscussion = await Discussion.findById(req.params.id)
            .populate('userId', 'name picture')
            .populate('replies.userId', 'name picture');

        res.json(updatedDiscussion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

export default router;
