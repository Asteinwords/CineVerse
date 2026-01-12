import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function GoogleAuthButton() {
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/google`,
        { token: credentialResponse.credential },
        { withCredentials: true }
      )

      login(response.data.user, response.data.token)
      navigate('/')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log('Login Failed')}
      text="Google Sign In"
      size="large"
    />
  )
}
