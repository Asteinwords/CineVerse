import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/auth/me`, {
        withCredentials: true
      })
      setUser(response.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem('token', token)
  }

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/auth/logout`, {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
