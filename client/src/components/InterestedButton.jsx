import { useState } from 'react'

export default function InterestedButton({ initialCount = 0 }) {
    const [count, setCount] = useState(initialCount)
    const [isInterested, setIsInterested] = useState(false)

    const toggleInterest = () => {
        setIsInterested(!isInterested)
        setCount(prev => isInterested ? prev - 1 : prev + 1)
    }

    return (
        <button
            onClick={toggleInterest}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300
                ${isInterested
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                    : 'glass text-white hover:bg-white/10'
                } hover:scale-105 active:scale-95`}
        >
            <svg
                className={`w-5 h-5 transition-transform duration-300 ${isInterested ? 'scale-110 fill-current' : ''}`}
                fill={isInterested ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>Interested</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isInterested ? 'bg-black/20' : 'bg-white/20'}`}>
                {(count + (isInterested ? 1 : 0)).toLocaleString()}
            </span>
        </button>
    )
}
