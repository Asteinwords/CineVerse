import { useState } from 'react'
import Navbar from '../components/Navbar'
import SearchBar from '../components/SearchBar'
import MoodSearch from '../components/MoodSearch'
import MovieGrid from '../components/MovieGrid'
import { Sparkles, Film, Tv, Gamepad2 } from 'lucide-react'

export default function Dashboard() {
  const [searchResults, setSearchResults] = useState([])
  const [searchTitle, setSearchTitle] = useState('')
  const [contentType, setContentType] = useState('movie')

  const handleSearch = (results, title) => {
    setSearchResults(results)
    setSearchTitle(title)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <header className="pt-40 pb-32" style={{ paddingTop: '1rem' }}>
        <div className="max-w-7xl px-6" style={{ margin: '0 auto' }}>
          <div className="max-w-4xl text-center space-y-16" style={{ margin: '0 auto' }}>
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-white bg-clip-text text-transparent">
                  Find Your Next
                </span>
                <br />
                <span className="text-white">Obsession</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed mt-8" style={{ margin: '1rem auto 0 auto' }}>
                Search millions of movies, TV shows, and more — instantly.
              </p>
            </div>

            {/* Primary Search Bar - Clean & Elevated */}
            <div className="max-w-3xl" style={{ margin: '1.5rem auto 0 auto' }}>
              <SearchBar
                onSearch={handleSearch}
                contentType={contentType}
                setContentType={setContentType}
              />
            </div>

            {/* Quick Content Type Selector */}
            <div className="flex justify-center gap-4 mt-8" style={{ paddingTop: '1rem' }}>
              {[
                { type: 'movie', icon: Film, label: 'Movies' },
                { type: 'tv', icon: Tv, label: 'TV Shows' },
                { type: 'all', icon: Gamepad2, label: 'All' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${contentType === type
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mood-Based Discovery */}
      <section className="pb-24 border-t border-white/10 bg-white/2" style={{ paddingTop: '1rem' }}>
        <div className="max-w-7xl px-6" style={{ margin: '0 auto' }}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Feeling a certain way?
            </h2>
            <p className="text-gray-400 mt-3 text-lg" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
              Let your mood guide you to the perfect watch
            </p>
          </div>
          <div className="max-w-5xl" style={{ margin: '0 auto' }}>
            <MoodSearch onSearch={handleSearch} contentType={contentType} />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <main className="py-20">
        <div className="max-w-7xl px-6" style={{ margin: '0 auto' }}>
          {searchResults.length > 0 ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">
                  {searchTitle}
                </h2>
                <span className="text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-full">
                  {searchResults.length} results
                </span>
              </div>
              <MovieGrid movies={searchResults} />
            </div>
          ) : (
            <div className="text-center py-40" style={{ paddingTop: '1rem' }}>
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/20 to-transparent border border-purple-600/30 mb-12 ">
                <Sparkles className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-medium text-gray-400">
                Start searching to discover something amazing
              </h3>
              <p className="text-gray-500 mt-3" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                Type a title, genre, or mood above
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center text-gray-600 text-sm border-t border-white/10">
        Powered by curiosity • Built for cinephiles
      </footer>
    </div>
  )
}