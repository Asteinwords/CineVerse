import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AIReviewAnalysis({ movieId, movieTitle, movieType = 'movie' }) {
    const [analysis, setAnalysis] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchAnalysis()
    }, [movieId])

    const fetchAnalysis = async () => {
        try {
            setLoading(true)
            setError(null)

            // First get the TMDB reviews
            const movieResponse = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/movies/${movieId}`,
                { params: { type: movieType } }
            )

            const tmdbReviews = movieResponse.data.reviews || []

            // Also fetch website discussions
            let websiteDiscussions = []
            try {
                const discussionsResponse = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/discussions/${movieId}`
                )
                websiteDiscussions = discussionsResponse.data || []
            } catch (discussionErr) {
                console.log('No discussions found or error fetching:', discussionErr.message)
            }

            // Combine TMDB reviews and website discussions
            const allReviews = [
                ...tmdbReviews,
                ...websiteDiscussions.map(discussion => ({
                    author: discussion.userId?.name || 'Anonymous',
                    content: discussion.content,
                    created_at: discussion.createdAt,
                    source: 'website'
                }))
            ]

            if (allReviews.length === 0) {
                setAnalysis({
                    summary: 'No reviews available yet. Be the first to share your thoughts!',
                    sentiment: { positive: 0, neutral: 0, negative: 0 },
                    keyThemes: [],
                    reviewCount: 0
                })
                setLoading(false)
                return
            }

            // Send to OpenAI for analysis
            try {
                const analysisResponse = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/openai/analyze-reviews`,
                    { reviews: allReviews, movieTitle }
                )
                setAnalysis(analysisResponse.data)
            } catch (analysisErr) {
                console.error('OpenAI analysis error:', analysisErr)
                // Use basic fallback if OpenAI fails
                setAnalysis({
                    summary: `Based on ${allReviews.length} reviews (${tmdbReviews.length} from TMDB, ${websiteDiscussions.length} from community), this title has received viewer feedback. Check individual reviews below for detailed opinions.`,
                    sentiment: { positive: 50, neutral: 30, negative: 20 },
                    keyThemes: ['User opinions vary'],
                    reviewCount: allReviews.length,
                    fallback: true
                })
            }
        } catch (err) {
            console.error('Error fetching movie data:', err)
            console.error('Error details:', err.response?.data || err.message)
            setError(`Failed to load review analysis: ${err.response?.data?.message || err.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="glass p-8 rounded-2xl mb-8 animate-fadeIn">
                <div className="flex items-center justify-center">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="glass p-6 rounded-2xl mb-8 border border-red-500/30">
                <p className="text-red-400">{error}</p>
            </div>
        )
    }

    if (!analysis) return null

    const { positive = 0, neutral = 0, negative = 0 } = analysis.sentiment || {}
    const total = positive + neutral + negative || 1

    return (
        <div className="glass-strong p-8 rounded-2xl mb-8 animate-slideUp">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">AI Review Analysis</h2>
                    <p className="text-gray-400 text-sm">Powered by OpenAI GPT-4</p>
                </div>
            </div>

            {/* Summary */}
            <div className="mb-6">
                <p className="text-gray-200 text-lg leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Sentiment Breakdown */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Sentiment Breakdown</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-400 font-medium">Positive</span>
                            <span className="text-white">{positive}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                                style={{ width: `${positive}%` }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400 font-medium">Neutral</span>
                            <span className="text-white">{neutral}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-gray-500 to-gray-400 transition-all duration-1000"
                                style={{ width: `${neutral}%` }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-red-400 font-medium">Negative</span>
                            <span className="text-white">{negative}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-pink-400 transition-all duration-1000"
                                style={{ width: `${negative}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Themes */}
            {analysis.keyThemes && analysis.keyThemes.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Key Themes</h3>
                    <div className="flex flex-wrap gap-2">
                        {analysis.keyThemes.map((theme, index) => (
                            <span
                                key={index}
                                className="px-4 py-2 glass rounded-full text-sm font-medium text-purple-300
                         hover:bg-purple-500/20 transition-all duration-300"
                            >
                                {theme}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Overall Rating */}
            {analysis.overallRating && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                    <span className="text-gray-400">AI Overall Rating:</span>
                    <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => (
                            <span
                                key={i}
                                className={`text-lg ${i < analysis.overallRating ? 'text-yellow-400' : 'text-gray-600'
                                    }`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <span className="text-white font-bold">{analysis.overallRating}/10</span>
                </div>
            )}

            {/* Review Count */}
            <p className="text-gray-400 text-sm mt-4">
                Based on {analysis.reviewCount} {analysis.reviewCount === 1 ? 'review' : 'reviews'}
                {analysis.fallback && ' (Basic analysis - OpenAI unavailable)'}
            </p>
        </div>
    )
}
