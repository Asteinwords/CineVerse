# CineVerse 🎬

A modern movie discovery platform with AI-powered recommendations, mood-based search, and personalized bookmarks.

## Features

- 🔍 **Smart Search** - Search movies, TV shows across multiple languages (Hollywood, Bollywood, Korean, Japanese, etc.)
- 🎭 **Mood-Based Discovery** - Find content based on your current mood
- 🤖 **AI Recommendations** - Vibe-based similarity engine for personalized suggestions
- 🔖 **Bookmarks** - Save your favorite movies and shows
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 🔐 **Google OAuth** - Secure authentication

## Tech Stack

### Frontend
- React 18 + Vite
- React Router v7
- Tailwind CSS v4
- Framer Motion
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Google OAuth 2.0
- TMDB API Integration
- Google Gemini AI

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- TMDB API Key
- Google OAuth Credentials
- Google Gemini API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Asteinwords/CineVerse.git
   cd CineVerse
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Configure environment variables**

   Create `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   TMDB_API_KEY=your_tmdb_api_key
   GEMINI_API_KEY=your_gemini_api_key
   CLIENT_URL=http://localhost:5173
   ```

   Create `client/.env`:
   ```env
   VITE_SERVER_URL=http://localhost:5000
   ```

4. **Run the application**
   ```bash
   # Terminal 1 - Run server
   cd server
   npm run dev

   # Terminal 2 - Run client
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## Deployment

### Deploy to Render (Recommended)

This project includes a `render.yaml` Blueprint for easy deployment.

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Configure environment variables
   - Click "Apply"

3. **Configure Environment Variables**
   - See detailed instructions in the deployment guide

For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## API Keys Setup

### TMDB API
1. Create account at https://www.themoviedb.org
2. Go to Settings → API
3. Request API key
4. Copy API key to `TMDB_API_KEY`

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins and redirect URIs
6. Copy Client ID to `GOOGLE_CLIENT_ID`

### Google Gemini AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy to `GEMINI_API_KEY`

## Project Structure

```
CineVerse/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   └── server.js         # Entry point
└── render.yaml           # Render deployment config
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Movie data provided by [TMDB](https://www.themoviedb.org)
- AI powered by [Google Gemini](https://ai.google.dev)
