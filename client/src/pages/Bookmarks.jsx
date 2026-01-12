import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import MovieCard from '../components/MovieCard'

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/bookmarks`, {
        withCredentials: true
      })
      setBookmarks(response.data)
    } catch (error) {
      console.error('Error fetching bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookmarkChange = () => {
    fetchBookmarks()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Bookmarks</h1>

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No bookmarks yet. Start adding your favorites!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bookmarks.map((bookmark) => (
              <MovieCard
                key={bookmark._id}
                movie={{
                  id: bookmark.movieId,
                  title: bookmark.movieTitle,
                  poster: bookmark.moviePoster || bookmark.poster_path || null,
                  type: bookmark.movieType
                }}
                onBookmarkChange={handleBookmarkChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
