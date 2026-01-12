import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MovieDetails from './pages/MovieDetails'
import CastProfile from './pages/CastProfile'
import Bookmarks from './pages/Bookmarks'
import Trending from './pages/Trending'
import SceneSearch from './pages/SceneSearch'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/movie/:id" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />
          <Route path="/cast/:personId" element={<ProtectedRoute><CastProfile /></ProtectedRoute>} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/trending" element={<ProtectedRoute><Trending /></ProtectedRoute>} />
          <Route path="/scene-search" element={<ProtectedRoute><SceneSearch /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
