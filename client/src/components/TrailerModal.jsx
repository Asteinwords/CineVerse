import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function TrailerModal({ isOpen, onClose, trailerKey, title }) {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    if (!isOpen || !trailerKey) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-all duration-300 group"
                >
                    <X className="w-6 h-6 group-hover:scale-110" />
                </button>

                {/* YouTube Embed */}
                <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                    title={`${title} Trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>

            {/* Backdrop Click to Close */}
            <div className="absolute inset-0 -z-10" onClick={onClose}></div>
        </div>
    )
}
