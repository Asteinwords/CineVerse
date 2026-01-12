import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'

export default function MovieCard({ movie }) {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const handleClick = () => {
    const movieType = movie.type === 'anime' ? 'tv' : movie.type || 'movie'
    navigate(`/movie/${movie.id}?type=${movieType}`)
  }

  const handleBookmark = async (e) => {
    e.stopPropagation() // Prevent card click

    if (!user) {
      alert('Please login to bookmark movies')
      return
    }

    try {
      if (isBookmarked) {
        await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/bookmarks/${movie.id}`, {
          withCredentials: true
        })
        setIsBookmarked(false)
      } else {
        await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/bookmarks`, {
          movieId: movie.id,
          movieTitle: movie.title,
          moviePoster: movie.poster,
          movieType: movie.type || 'movie'
        }, {
          withCredentials: true
        })
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Bookmark error:', error)
    }
  }

  const posterUrl = movie.poster
    ? (movie.poster.startsWith('http')
      ? movie.poster
      : `https://image.tmdb.org/t/p/w500${movie.poster}`)
    : null

  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer card-hover glass
                 transform transition-all duration-300 animate-fadeIn"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
        {posterUrl && !imgError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500
                     group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center p-4">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <p className="text-gray-500 text-sm">No Image</p>
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent
                      opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-3 right-3 glass-strong px-3 py-1 rounded-full 
                        flex items-center gap-1 backdrop-blur-md">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-white font-bold text-sm">{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Type Badge */}
        {movie.type && (
          <div className="absolute top-3 left-3 glass-strong px-3 py-1 rounded-full backdrop-blur-md">
            <span className="text-purple-300 font-semibold text-xs uppercase">{movie.type}</span>
          </div>
        )}

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 opacity-0 group-hover:opacity-100
                    ${isBookmarked ? 'bg-pink-600 shadow-lg shadow-pink-500/30' : 'glass-strong hover:bg-white/20'}`}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isBookmarked ? 'scale-110 fill-current text-white' : 'text-white'}`}
            fill={isBookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 
                    group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-bold text-lg line-clamp-2 mb-1 
                     group-hover:text-transparent group-hover:bg-clip-text 
                     group-hover:bg-gradient-to-r group-hover:from-purple-400 
                     group-hover:to-pink-400 transition-all duration-300">
          {movie.title}
        </h3>

        {movie.releaseDate && (
          <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 
                      transition-opacity duration-300">
            {new Date(movie.releaseDate).getFullYear()}
          </p>
        )}

        {movie.overview && (
          <p className="text-gray-400 text-xs line-clamp-2 mt-2 opacity-0 
                      group-hover:opacity-100 transition-opacity duration-300">
            {movie.overview}
          </p>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                    pointer-events-none rounded-2xl"
        style={{ boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)' }}>
      </div>
    </div>
  )
}

