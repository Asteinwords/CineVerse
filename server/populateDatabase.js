import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import { ensurePopularMoviesHaveEmbeddings } from './services/embeddingService.js';

async function populateDatabase() {
    try {
        console.log('🚀 Starting database population...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/moviedb');
        console.log('✓ Connected to MongoDB\n');

        // Generate embeddings for popular movies
        console.log('📊 Fetching and processing popular movies...');
        console.log('This will use Gemini API (OpenAI quota exceeded)\n');

        const results = await ensurePopularMoviesHaveEmbeddings(20);

        console.log('\n📈 Results:');
        console.log(`Total processed: ${results.length}`);

        const successful = results.filter(r => r.movie);
        const failed = results.filter(r => r.error);

        console.log(`✓ Successful: ${successful.length}`);
        console.log(`✗ Failed: ${failed.length}`);

        if (successful.length > 0) {
            console.log('\n✅ Sample movies with embeddings:');
            successful.slice(0, 5).forEach(r => {
                console.log(`  - ${r.movie.title} (${r.cached ? 'cached' : 'newly generated'})`);
            });
        }

        if (failed.length > 0) {
            console.log('\n❌ Failed movies:');
            failed.forEach(r => {
                console.log(`  - Movie ID ${r.tmdbId}: ${r.error}`);
            });
        }

        console.log('\n🎉 Database population complete!');
        console.log('You can now test the Scene Search feature.\n');

    } catch (error) {
        console.error('❌ Error populating database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
        process.exit(0);
    }
}

populateDatabase();
