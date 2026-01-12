// frontend/src/pages/Login.jsx
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { motion } from 'framer-motion';

export default function Login() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen grid md:grid-cols-2 font-body">
      {/* Left Side – Black & White Branding */}
      <div className="bg-black text-white flex flex-col items-center justify-center p-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter mb-6">
            CineVerse
            <span className="text-gray-400">.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light max-w-lg leading-relaxed">
            Discover your next favorite movie,
            <br />
            <span className="text-white font-medium">powered by AI</span>
          </p>
        </motion.div>
      </div>

      {/* Right Side – Big Clean Card */}
      <div className="flex items-center justify-center bg-gray-50 px-6">
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-12 md:p-16 w-full max-w-lg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Sign in to continue your cinematic journey
            </p>
          </div>

          {/* Google Sign-In Button – Centered & Prominent */}
          <div className="flex justify-center">
            <GoogleAuthButton />
          </div>

          {/* Simple Divider */}
          <div className="my-10 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 bg-gray-50">Secure login</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}