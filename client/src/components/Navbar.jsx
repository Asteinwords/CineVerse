import { useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [imageError, setImageError] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-black border-b border-purple-900/30 sticky top-0 z-50 backdrop-blur-xl bg-black/90">
      <div className="max-w-7xl px-6" style={{ margin: '0 auto' }}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            {/* <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-black text-lg">CS</span>
              </div> */}
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
              CineVerse
            </span>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-10">
            {['/', '/trending', '/bookmarks'].map((path) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative text-sm font-medium transition-all duration-300 px-1 pb-1
                    ${isActive(path)
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {path === '/' && 'Discover'}
                {path === '/trending' && 'Trending'}
                {path === '/bookmarks' && 'Bookmarks'}

                {isActive(path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"></span>
                )}
              </button>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 group">
                  {user.picture && !imageError ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      onError={() => setImageError(true)}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-300 group-hover:text-white transition">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-purple-600/20 backdrop-blur-md text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-purple-600/30 hover:text-white hover:border-purple-400 transition-all duration-300 shadow-lg shadow-purple-500/10"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full text-sm font-medium hover:from-purple-500 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-purple-500/30"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Optional subtle bottom glow effect */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"></div>
    </nav>
  )
}