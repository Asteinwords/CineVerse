import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import AIReviewAnalysis from '../components/AIReviewAnalysis'
import WatchProviders from '../components/WatchProviders'
import BookmarkButton from '../components/BookmarkButton'
import InterestedButton from '../components/InterestedButton'
import DiscussionSection from '../components/DiscussionSection'
import TrailerModal from '../components/TrailerModal'
import ReviewCard from '../components/ReviewCard'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Play } from 'lucide-react'

export default function MovieDetails() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trailerKey, setTrailerKey] = useState(null)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const type = searchParams.get('type') || 'movie'

  useEffect(() => {
    fetchMovieDetails()
  }, [id, type])

  const fetchMovieDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/movies/${id}`, {
        params: { type }
      })
      setMovie(response.data)
      fetchTrailer()
    } catch (error) {
      console.error('Error fetching movie details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrailer = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/trailers/${id}`, {
        params: { type }
      })
      if (response.data.trailer) {
        setTrailerKey(response.data.trailer.key)
      }
    } catch (error) {
      console.error('Error fetching trailer:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f23]">
        <Navbar />
        <LoadingSpinner fullscreen />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0f0f23]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-white text-xl">Movie not found</p>
        </div>
      </div>
    )
  }

  const backdropUrl = movie.backdrop
    ? `https://image.tmdb.org/t/p/original${movie.backdrop}`
    : '/placeholder.svg?height=800&width=1280'

  const genreData = movie.genres?.slice(0, 4).map((g, i) => ({
    name: g.name,
    value: (100 / Math.min(movie.genres.length, 4))
  })) || []

  const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b']

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white font-sans">
      <Navbar />

      {/* Hero Section with Parallax Effect */}
      <div className="relative h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            filter: 'brightness(0.4)'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] via-[#0f0f23]/60 to-transparent pointer-events-none"></div>

        {/* Play Button Overlay on Backdrop */}
        {trailerKey && (
          <div
            className="absolute top-0 left-0 right-0 bottom-1/3 flex items-center justify-center z-30"
          >
            <div
              onClick={() => setIsTrailerOpen(true)}
              className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center 
                        hover:scale-110 hover:bg-purple-600/60 transition-all duration-300 shadow-xl cursor-pointer
                        opacity-70 hover:opacity-100"
            >
              <Play className="w-7 h-7 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10 max-w-7xl mx-auto w-full px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster with Hover Zoom */}
            <div className="hidden md:block flex-shrink-0 w-72 group perspective">
              <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl 
                            transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-y-6
                            border-4 border-white/10 glass">
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Hero Content */}
            <div className="flex-1 mb-4 animate-slideUp">
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-medium text-gray-300">
                <span className="px-3 py-1 glass rounded-full uppercase tracking-wider">
                  {movie.status || 'Released'}
                </span>
                <span>{new Date(movie.releaseDate).getFullYear()}</span>
                <span>•</span>
                <span>{movie.runtime} min</span>
                <span>•</span>
                <div className="flex gap-2">
                  {movie.genres?.slice(0, 3).map(g => (
                    <span key={g.id} className="text-purple-400">{g.name}</span>
                  ))}
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight gradient-text">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-1 mb-8">
                <div className="flex items-center gap-2 glass-strong pr-5 pl-2 py-2.5 rounded-full">
                  <span className="text-yellow-400 text-2xl">★</span>
                  <span className="text-3xl font-bold">{movie.rating?.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm mt-2">/10</span>
                </div>

                <InterestedButton />
                <BookmarkButton movie={movie} type={type} />
              </div>

              <p className="text-lg text-gray-200 leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-none hidden">
                {/* Overview moved to separate section */}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Section - New */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pb-0">
        <h2 className="text-2xl font-bold mb-4 border-l-4 border-purple-500 pl-4">Overview</h2>
        <p className="text-lg text-gray-300 leading-relaxed pl-4">
          {movie.overview}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-12">

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fadeIn">
              {movie.directors && movie.directors.length > 0 && (
                <div className="glass p-4 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase font-bold mb-1">Directed By</p>
                  <p className="font-semibold text-purple-400 hover:text-purple-300 cursor-pointer transition-colors">
                    {movie.directors.map(d => d.name).join(', ')}
                  </p>
                </div>
              )}
              {movie.originCountry && (
                <div className="glass p-4 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase font-bold mb-1">Country</p>
                  <p className="font-semibold">{movie.originCountry.join(', ')}</p>
                </div>
              )}
              {movie.spokenLanguages && (
                <div className="glass p-4 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase font-bold mb-1">Language</p>
                  <p className="font-semibold">{movie.spokenLanguages.map(l => l.english_name).join(', ')}</p>
                </div>
              )}
              <div className="glass p-4 rounded-xl">
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Status</p>
                <p className="font-semibold text-green-400">{movie.status}</p>
              </div>
            </div>

            {/* Tags / Keywords */}
            {movie.keywords && movie.keywords.length > 0 && (
              <div className="animate-slideUp">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-purple-500">#</span> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {movie.keywords.slice(0, 15).map((keyword, index) => (
                    <span
                      key={keyword.id}
                      className="px-4 py-2 glass rounded-full text-sm text-gray-300 hover:text-white 
                               hover:bg-white/10 transition-all duration-300 cursor-pointer animate-fadeIn"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {typeof keyword === 'string' ? keyword : keyword.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cast Section - Circular Avatars */}
            <div className="animate-slideUp">
              <h2 className="text-2xl font-bold mb-6 border-l-4 border-purple-500 pl-4">Top Cast</h2>
              <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide">
                {movie.cast?.map((actor, index) => (
                  <div
                    key={actor.id}
                    onClick={() => navigate(`/cast/${actor.id}`)}
                    className="flex-shrink-0 w-32 group cursor-pointer text-center"
                  >
                    <div className="w-28 h-28 mx-auto mb-3 rounded-full overflow-hidden border-2 border-white/10 
                                  group-hover:border-purple-500 transition-all duration-300 group-hover:scale-105
                                  shadow-lg">
                      <img
                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : '/placeholder.svg?height=200&width=200'}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="font-semibold text-sm truncate group-hover:text-purple-400 transition-colors">
                      {actor.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {actor.character}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Watch Providers */}
            <WatchProviders providers={movie.watchProviders} />

            {/* AI Review Summary */}
            <AIReviewAnalysis movieId={id} movieTitle={movie.title} movieType={type} />

            {/* User Reviews from TMDB */}
            {movie.reviews && movie.reviews.length > 0 && (
              <div className="glass-strong p-8 rounded-2xl mb-8 animate-slideUp">
                <h2 className="text-2xl font-bold mb-6 gradient-text">User Reviews</h2>
                <div className="space-y-6">
                  {movie.reviews.slice(0, 5).map((review, i) => (
                    <ReviewCard key={i} review={review} />
                  ))}
                </div>
              </div>
            )}

            {/* User Discussions */}
            <DiscussionSection movieId={id} movieTitle={movie.title} />

          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Production Companies */}
            {movie.productionCompanies && movie.productionCompanies.length > 0 && (
              <div className="glass-strong p-6 rounded-2xl animate-slideUp">
                <h3 className="text-lg font-bold mb-4">Production</h3>
                <div className="space-y-4">
                  {movie.productionCompanies.map(company => (
                    <div key={company.id} className="flex items-center gap-4 p-3 glass rounded-xl hover:bg-white/5 transition">
                      {company.logo_path ? (
                        <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center flex-shrink-0">
                          <img
                            src={`https://image.tmdb.org/t/p/w200${company.logo_path}`}
                            alt={company.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                          🏢
                        </div>
                      )}
                      <span className="font-medium text-sm">{company.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Genre Chart */}
            {genreData.length > 0 && (
              <div className="glass-strong p-6 rounded-2xl animate-slideUp">
                <h3 className="text-lg font-bold mb-4">Genre Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-4">
                  {genreData.map((g, i) => (
                    <div key={g.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                        <span className="text-sm text-gray-300">{g.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500">{Math.round(g.value)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerKey={trailerKey}
        title={movie.title}
      />
    </div>
  )
}
