import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import bookmarkRoutes from './routes/bookmarks.js';
import discussionRoutes from './routes/discussions.js';
import castRoutes from './routes/cast.js';
import trendingRoutes from './routes/trending.js';
import openaiRoutes from './routes/openai.js';
import trailerRoutes from './routes/trailers.js';
import sceneSearchRoutes from './routes/sceneSearch.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/moviedb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/cast', castRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/trailers', trailerRoutes);
app.use('/api/scene-search', sceneSearchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
