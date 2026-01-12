import { useState, useEffect } from 'react'
import axios from 'axios'

export default function BookmarkButton({ movie, type }) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkBookmarkStatus()
  }, [movie.id])

  const checkBookmarkStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/bookmarks/check/${movie.id}`, {
        withCredentials: true
      })
      setIsBookmarked(response.data.isBookmarked)
    } catch (error) {
      // If not logged in or error, default to false
      setIsBookmarked(false)
    }
  }

  const toggleBookmark = async () => {
    setLoading(true)
    try {
      if (isBookmarked) {
        await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/bookmarks/${movie.id}`, {
          withCredentials: true
        })
        setIsBookmarked(false)
      } else {
        await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/bookmarks`, {
          movieId: movie.id,
          type: type,
          title: movie.title,
          poster: movie.poster,
          rating: movie.rating
        }, {
          withCredentials: true
        })
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Bookmark error:', error)
      // Optionally show toast notification here
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300
                ${isBookmarked
          ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
          : 'glass text-white hover:bg-white/10'
        } hover:scale-105 active:scale-95`}
    >
      <svg
        className={`w-5 h-5 transition-transform duration-300 ${isBookmarked ? 'scale-110 fill-current' : ''}`}
        fill={isBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
    </button>
  )
}
