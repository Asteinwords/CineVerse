import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
    tmdbId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['movie', 'tv', 'anime'],
        required: true
    },
    vibeDescription: {
        type: String,
        default: ''
    },
    vibeEmbedding: {
        type: [Number],
        default: []
    },
    genres: [String],
    keywords: [String],
    colorPalette: [String],
    emotionalTones: [String],
    cinematographyStyle: String,
    overview: String,
    posterPath: String,
    backdropPath: String,
    rating: Number,
    releaseDate: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient embedding searches
movieSchema.index({ vibeEmbedding: 1 });
movieSchema.index({ type: 1, rating: -1 });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
