# CineSearch - Movie Discovery Platform

A full-stack movie search and recommendation platform built with React, Node.js, Express, and MongoDB.

## Features

- **Google OAuth Authentication**: Secure sign-in with Google
- **Movie Search**: Search movies, series, and anime
- **Mood-Based Search**: Find content based on your mood
- **Movie Details**: Comprehensive movie information with cast, ratings, and genres
- **Cast Profiles**: Explore actor information and filmography
- **AI Review Summary**: Intelligent aggregation of movie reviews
- **Bookmarks**: Save your favorite movies
- **Trending**: Discover trending movies and series
- **Dark Mode UI**: Modern, sleek interface with Tailwind CSS

## Project Structure

\`\`\`
/client                 # React + Vite frontend
  /src
    /components        # Reusable UI components
    /pages            # Page components
    /context          # React Context for state management
    /assets           # Images and static files

/server                 # Express backend
  /routes              # API routes
  /models              # MongoDB schemas
  /middleware          # Authentication middleware
  /config              # Configuration files
\`\`\`

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud instance)
- Google OAuth credentials
- TMDB API key

### Backend Setup

1. Navigate to the server directory:
   \`\`\`bash
   cd server
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create `.env` file from `.env.example` and add your credentials:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

   For development with auto-reload:
   \`\`\`bash
   npm run dev
   \`\`\`

### Frontend Setup

1. Navigate to the client directory:
   \`\`\`bash
   cd client
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create `.env` file from `.env.example`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

The app will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth sign-in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Movies
- `GET /api/movies/search` - Search movies/series
- `GET /api/movies/mood-search` - Search by mood
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/:id/review-summary` - Get AI review summary

### Bookmarks
- `GET /api/bookmarks` - Get user bookmarks
- `POST /api/bookmarks` - Add bookmark
- `DELETE /api/bookmarks/:movieId` - Remove bookmark
- `GET /api/bookmarks/check/:movieId` - Check if bookmarked

### Cast
- `GET /api/cast/:personId` - Get cast details

### Trending
- `GET /api/trending/movies` - Get trending movies
- `GET /api/trending/tv` - Get trending series

## Environment Variables

### Server (.env)
\`\`\`
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TMDB_API_KEY=your_tmdb_api_key
WATCHMODE_API_KEY=your_watchmode_api_key
PORT=5000
CLIENT_URL=http://localhost:5173
\`\`\`

### Client (.env)
\`\`\`
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_SERVER_URL=http://localhost:5000
\`\`\`

## Technologies Used

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios
- Recharts
- Google OAuth

### Backend
- Node.js
- Express.js
- MongoDB
- JWT
- Axios

## Features Implemented

✅ Google OAuth authentication
✅ Movie search and filtering
✅ Mood-based search
✅ Movie details page with cast and ratings
✅ Cast profile pages
✅ AI-powered review summaries
✅ Bookmark system
✅ Trending movies and series
✅ Responsive dark mode UI
✅ JWT-based authentication

## Getting Help

For issues, questions, or feature requests, please open an issue on the repository.

## License

MIT
