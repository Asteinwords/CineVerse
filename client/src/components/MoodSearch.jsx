import { useState } from 'react'
import axios from 'axios'
import { Sun, CloudRain, Flame, Coffee, Heart, Ghost, Star, Zap } from 'lucide-react'

const moods = [
  { name: 'happy', icon: Sun, color: 'from-yellow-400 to-orange-500' },
  { name: 'sad', icon: CloudRain, color: 'from-blue-400 to-indigo-600' },
  { name: 'angry', icon: Flame, color: 'from-red-500 to-rose-600' },
  { name: 'nostalgic', icon: Coffee, color: 'from-amber-600 to-yellow-700' },
  { name: 'relaxed', icon: Heart, color: 'from-emerald-400 to-teal-500' },
  { name: 'scary', icon: Ghost, color: 'from-purple-600 to-pink-600' },
  { name: 'inspired', icon: Star, color: 'from-cyan-400 to-blue-500' },
  { name: 'excited', icon: Zap, color: 'from-pink-500 to-purple-600' },
]

export default function MoodSearch({ onSearch, contentType = 'movie' }) {
  const [loadingMood, setLoadingMood] = useState('')

  const handleMoodClick = async (mood) => {
    setLoadingMood(mood.name)
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/movies/mood-search`, {
        params: { mood: mood.name, type: contentType }
      })
      onSearch(res.data, `Feeling ${mood.name.charAt(0).toUpperCase() + mood.name.slice(1)}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMood('')
    }
  }

  return (
    <div className="grid grid-cols-8 gap-4 max-w-5xl" style={{ margin: '0 auto' }}>
      {moods.map((mood) => {
        const Icon = mood.icon
        const isLoading = loadingMood === mood.name

        return (
          <button
            key={mood.name}
            onClick={() => handleMoodClick(mood)}
            disabled={!!loadingMood}
            className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-4 transition-all duration-500 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105 disabled:opacity-70"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-3 rounded-xl bg-white/10 group-hover:bg-purple-500/20 transition-all duration-300">
                <Icon className="w-8 h-8 text-purple-300 group-hover:text-purple-100" />
              </div>
              <span className="text-sm font-semibold capitalize text-gray-200">
                {mood.name}
              </span>
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
              style={{ backgroundImage: `linear-gradient(to bottom right, transparent, ${mood.color.split(' ')[1]}, transparent)` }}
            />
          </button>
        )
      })}
    </div>
  )
}