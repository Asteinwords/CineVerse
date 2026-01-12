import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import MovieCard from '../components/MovieCard'

export default function Trending() {
  const [trending, setTrending] = useState([])
  const [activeType, setActiveType] = useState('movies')
  const [activeCountry, setActiveCountry] = useState('IN')
  const [loading, setLoading] = useState(true)

  const countries = [
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' }
  ]

  useEffect(() => {
    fetchTrending()
  }, [activeType, activeCountry])

  const fetchTrending = async () => {
    setLoading(true)
    try {
      const endpoint = activeType === 'movies' ? 'movies' : 'tv'
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/trending/${endpoint}`, {
        params: { region: activeCountry }
      })
      setTrending(response.data)
    } catch (error) {
      console.error('Error fetching trending:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white gradient-text">Trending Now</h1>

          <div className="flex flex-wrap gap-4">
            {/* Content Type Selector */}
            <div className="glass p-1 rounded-xl flex">
              <button
                onClick={() => setActiveType('movies')}
                className={`px-6 py-2 rounded-lg font-medium transition ${activeType === 'movies'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                Movies
              </button>
              <button
                onClick={() => setActiveType('tv')}
                className={`px-6 py-2 rounded-lg font-medium transition ${activeType === 'tv'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
                  }`}
              >
                Series
              </button>
            </div>

            {/* Country Selector */}
            <div className="glass p-1 rounded-xl flex overflow-x-auto">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setActiveCountry(country.code)}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap ${activeCountry === country.code
                    ? 'bg-white/20 text-white shadow-lg border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  title={country.name}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="hidden md:inline">{country.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="spinner w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trending.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
