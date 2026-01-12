import React from 'react'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-red-500 mb-2">CineSearch</h1>
          <p className="text-gray-400 text-xl">Full-Stack Movie Discovery Platform</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Project Overview</h2>
          <p className="text-gray-300 mb-4">
            This is a complete full-stack movie search and recommendation platform built with React, Node.js, Express, and MongoDB.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 my-8">
            <div>
              <h3 className="text-lg font-semibold text-red-500 mb-3">Frontend</h3>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>✓ React 18 + Vite</li>
                <li>✓ Tailwind CSS (Dark Mode)</li>
                <li>✓ Google OAuth Authentication</li>
                <li>✓ Recharts for visualizations</li>
                <li>✓ Movie search & filtering</li>
                <li>✓ Mood-based recommendations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-500 mb-3">Backend</h3>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>✓ Node.js + Express</li>
                <li>✓ MongoDB with Mongoose</li>
                <li>✓ Google OAuth with JWT</li>
                <li>✓ TMDB API Integration</li>
                <li>✓ AI Review Summarization</li>
                <li>✓ RESTful API endpoints</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2">Search & Discovery</h4>
              <ul className="space-y-1 ml-4">
                <li>• Search by movie/series/anime name</li>
                <li>• Search by mood (happy, sad, angry, etc.)</li>
                <li>• Autocomplete suggestions</li>
                <li>• Filter by type</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">User Features</h4>
              <ul className="space-y-1 ml-4">
                <li>• Google sign-in/signup</li>
                <li>• Bookmark favorite movies</li>
                <li>• View bookmarked collection</li>
                <li>• Persistent user sessions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Movie Details</h4>
              <ul className="space-y-1 ml-4">
                <li>• Cast & crew information</li>
                <li>• Rating and reviews</li>
                <li>• Genre breakdown charts</li>
                <li>• AI-powered review summaries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Trending</h4>
              <ul className="space-y-1 ml-4">
                <li>• Trending movies this week</li>
                <li>• Trending TV series</li>
                <li>• Global & regional trends</li>
                <li>• Updated daily</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-red-500 font-semibold mb-2">Prerequisites</h3>
              <ul className="text-gray-400 text-sm space-y-1 ml-4">
                <li>• Node.js v16+</li>
                <li>• MongoDB (local or cloud)</li>
                <li>• Google OAuth credentials</li>
                <li>• TMDB API key</li>
              </ul>
            </div>

            <div>
              <h3 className="text-red-500 font-semibold mb-2">Backend Setup</h3>
              <div className="bg-gray-900 p-3 rounded text-gray-300 text-xs font-mono space-y-1">
                <div>cd server</div>
                <div>npm install</div>
                <div>cp .env.example .env</div>
                <div># Add your API keys to .env</div>
                <div>npm start</div>
              </div>
            </div>

            <div>
              <h3 className="text-red-500 font-semibold mb-2">Frontend Setup</h3>
              <div className="bg-gray-900 p-3 rounded text-gray-300 text-xs font-mono space-y-1">
                <div>cd client</div>
                <div>npm install</div>
                <div>cp .env.example .env</div>
                <div>npm run dev</div>
              </div>
            </div>

            <div>
              <h3 className="text-red-500 font-semibold mb-2">Access the App</h3>
              <p className="text-gray-400 text-sm">
                Frontend: <span className="text-white">http://localhost:5173</span><br />
                Backend: <span className="text-white">http://localhost:5000</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Project Structure</h2>
          <div className="bg-gray-900 p-4 rounded text-gray-400 text-xs font-mono overflow-x-auto">
            <pre>{`cine-search/
├── client/                 # Vite + React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Auth context
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── models/            # MongoDB models
│   ├── middleware/        # Auth middleware
│   ├── config/            # Configuration
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md`}</pre>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>This project is a standalone full-stack application. Download the code and follow the Quick Start guide to run it locally.</p>
        </div>
      </div>
    </div>
  )
}
