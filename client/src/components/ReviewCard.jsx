import { useState } from 'react'

export default function ReviewCard({ review }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const MAX_LENGTH = 300
    const content = review.content || ''
    const shouldTruncate = content.length > MAX_LENGTH

    const displayedContent = isExpanded ? content : content.slice(0, MAX_LENGTH)

    return (
        <div className="glass p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 
                      flex items-center justify-center text-xl font-bold shadow-lg flex-shrink-0">
                    {review.author.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 className="font-bold text-white">{review.author}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{new Date(review.created_at || Date.now()).toLocaleDateString()}</span>
                        {review.author_details?.rating && (
                            <span className="flex items-center gap-1 text-yellow-500">
                                ★ {review.author_details.rating}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-gray-300 text-sm leading-relaxed">
                <p>
                    {displayedContent}
                    {!isExpanded && shouldTruncate && '...'}
                </p>

                {shouldTruncate && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-2 text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors focus:outline-none"
                    >
                        {isExpanded ? 'Read Less' : 'Read More'}
                    </button>
                )}
            </div>
        </div>
    )
}
