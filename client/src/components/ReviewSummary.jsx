import { useState } from 'react'
import axios from 'axios'

export default function ReviewSummary({ movieId, movieType = 'movie' }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleGenerateSummary = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/movies/${movieId}/review-summary`,
        { params: { type: movieType } }
      )
      setSummary(response.data)
      setExpanded(true)
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8">
      {!summary && (
        <button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate AI Review Summary'}
        </button>
      )}

      {summary && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">AI Review Summary</h3>
              <p className="text-gray-400 text-sm">{summary.reviewCount} reviews analyzed</p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-white transition"
            >
              {expanded ? '−' : '+'}
            </button>
          </div>

          {expanded && (
            <>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <p className="text-gray-300 leading-relaxed">{summary.summary}</p>
              </div>

              {summary.sampleReviews && summary.sampleReviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-white font-semibold mb-3">Sample Reviews</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {summary.sampleReviews.map((review, i) => (
                      <div key={i} className="bg-gray-900 p-3 rounded border border-gray-700">
                        <p className="text-white font-medium text-sm">{review.author}</p>
                        <p className="text-gray-400 text-sm mt-2 line-clamp-3">{review.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
