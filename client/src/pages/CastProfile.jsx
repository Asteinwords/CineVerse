import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CastProfile() {
  const { personId } = useParams()
  const navigate = useNavigate()
  const [cast, setCast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCastDetails()
  }, [personId])

  const fetchCastDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/cast/${personId}`)
      setCast(response.data)
    } catch (error) {
      console.error('Error fetching cast:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMovieClick = (credit) => {
    // Determine if it's a movie or TV show based on the presence of title vs name
    const isMovie = !!credit.title
    const mediaType = isMovie ? 'movie' : 'tv'
    navigate(`/movie/${credit.id}?type=${mediaType}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #0f0f23, #1a1a2e)' }}>
        <Navbar />
        <LoadingSpinner fullscreen />
      </div>
    )
  }

  if (!cast) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #0f0f23, #1a1a2e)' }}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-white text-xl">Cast not found</p>
        </div>
      </div>
    )
  }

  const profileUrl = cast.profileImage
    ? `https://image.tmdb.org/t/p/w500${cast.profileImage}`
    : '/placeholder.svg?height=500&width=350'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #0f0f23, #1a1a2e)' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8 mb-12 animate-fadeIn">
          <div className="flex-shrink-0">
            <img
              src={profileUrl || "/placeholder.svg"}
              alt={cast.name}
              className="w-72 h-96 rounded-2xl shadow-2xl object-cover glass"
            />
          </div>

          <div className="flex-grow">
            <h1 className="text-5xl font-black text-white mb-4 gradient-text">{cast.name}</h1>

            <div className="grid grid-cols-2 gap-6 mb-6">
              {cast.birthday && (
                <div className="glass p-4 rounded-xl">
                  <p className="text-gray-400 text-sm uppercase mb-1">Born</p>
                  <p className="text-white font-semibold text-lg">{cast.birthday}</p>
                </div>
              )}
              {cast.placeOfBirth && (
                <div className="glass p-4 rounded-xl">
                  <p className="text-gray-400 text-sm uppercase mb-1">Place of Birth</p>
                  <p className="text-white font-semibold text-lg">{cast.placeOfBirth}</p>
                </div>
              )}
              <div className="glass p-4 rounded-xl">
                <p className="text-gray-400 text-sm uppercase mb-1">Popularity</p>
                <p className="text-white font-semibold text-lg">{cast.popularity?.toFixed(0)}</p>
              </div>
            </div>

            {cast.biography && (
              <div className="glass p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-white mb-3">Biography</h2>
                <p className="text-gray-300 leading-relaxed">{cast.biography}</p>
              </div>
            )}
          </div>
        </div>

        {/* Known For */}
        {cast.movieCredits && cast.movieCredits.length > 0 && (
          <div className="mb-12 animate-slideUp">
            <h2 className="text-3xl font-bold text-white mb-6 gradient-text">Known For</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cast.movieCredits.slice(0, 10).map((movie, index) => (
                <div
                  key={movie.id}
                  onClick={() => handleMovieClick(movie)}
                  className="glass rounded-2xl overflow-hidden card-hover cursor-pointer animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : '/placeholder.svg?height=300&width=200'}
                    alt={movie.title || movie.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-3">
                    <p className="text-white text-sm font-semibold line-clamp-2">{movie.title || movie.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
