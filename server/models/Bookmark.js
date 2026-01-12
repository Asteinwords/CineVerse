import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movieId: {
    type: Number,
    required: true
  },
  movieTitle: String,
  moviePoster: String,
  movieType: {
    type: String,
    enum: ['movie', 'series', 'anime'],
    default: 'movie'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Bookmark', bookmarkSchema);
