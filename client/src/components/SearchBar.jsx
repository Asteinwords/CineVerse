import { useState } from 'react'
import { Search, X, Film, Tv } from 'lucide-react'
import axios from 'axios'

export default function SearchBar({ onSearch, contentType }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const type = contentType === 'all' ? '' : contentType
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/movies/search`, {
        params: { query, type: type || undefined }
      })
      onSearch(res.data, `Results for "${query}"`)
      setQuery('')
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="relative flex items-center">
        <Search className="absolute left-6 w-6 h-6 text-gray-400 pointer-events-none" />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${contentType === 'tv' ? 'TV shows' : contentType === 'all' ? 'everything' : 'movies'}...`}
          className="w-full pl-16 pr-36 py-5 bg-white/5 border border-white/10 rounded-2xl text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all duration-300 backdrop-blur-xl"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-36 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-3 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/40 disabled:shadow-none"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  )
}