import { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'

export default function DiscussionSection({ movieId, movieTitle }) {
    const { user } = useContext(AuthContext)
    const [discussions, setDiscussions] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [replyingTo, setReplyingTo] = useState(null)
    const [replyContent, setReplyContent] = useState('')

    useEffect(() => {
        fetchDiscussions()
    }, [movieId])

    const fetchDiscussions = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/discussions/${movieId}`)
            setDiscussions(response.data)
        } catch (error) {
            console.error('Error fetching discussions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return

        if (!user) {
            alert('Please login to post a comment')
            return
        }

        try {
            console.log('Posting comment...', { movieId, movieTitle, content: newComment })
            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/discussions`, {
                movieId: parseInt(movieId),
                movieTitle,
                content: newComment
            }, { withCredentials: true })

            console.log('Comment posted successfully:', response.data)
            setDiscussions([response.data, ...discussions])
            setNewComment('')
        } catch (error) {
            console.error('Error posting comment:', error.response || error)
            const errorMessage = error.response?.data?.error || 'Failed to post comment. Please try again.'
            alert(errorMessage)
        }
    }

    const handleLike = async (discussionId) => {
        if (!user) return alert('Please login to like')

        try {
            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/discussions/${discussionId}/like`, {}, {
                withCredentials: true
            })

            setDiscussions(discussions.map(d =>
                d._id === discussionId ? { ...d, likes: response.data.likes } : d
            ))
        } catch (error) {
            console.error('Error liking discussion:', error)
        }
    }

    const handleReply = async (discussionId) => {
        if (!replyContent.trim()) return

        try {
            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/discussions/${discussionId}/reply`, {
                content: replyContent
            }, { withCredentials: true })

            setDiscussions(discussions.map(d =>
                d._id === discussionId ? response.data : d
            ))
            setReplyingTo(null)
            setReplyContent('')
        } catch (error) {
            console.error('Error posting reply:', error)
        }
    }

    return (
        <div className="glass-strong p-8 rounded-2xl animate-slideUp">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold gradient-text">User Discussions</h2>
                <div className="text-sm text-gray-400">
                    {discussions.length} {discussions.length === 1 ? 'Discussion' : 'Discussions'}
                </div>
            </div>

            {/* Comment Input */}
            {user ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="flex gap-4">
                        <img
                            src={user.picture}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border-2 border-purple-500"
                        />
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Share your thoughts on this movie..."
                                className="w-full bg-white/5 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold 
                           disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                                >
                                    Post Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="glass p-4 rounded-xl mb-8 text-center">
                    <p className="text-gray-300">Please login to join the discussion</p>
                </div>
            )}

            {/* Discussions List */}
            <div className="space-y-6">
                {discussions.map((discussion) => (
                    <div key={discussion._id} className="glass p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-start gap-4">
                            <img
                                src={discussion.userId?.picture || `https://ui-avatars.com/api/?name=${discussion.userId?.name || 'User'}`}
                                alt={discussion.userId?.name}
                                className="w-12 h-12 rounded-full bg-gray-700"
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="font-bold text-white flex items-center gap-2">
                                            {discussion.userId?.name || 'Unknown User'}
                                            {/* Verification Badge Mockup */}
                                            <span className="text-blue-400 text-xs">✓</span>
                                        </h4>
                                        <span className="text-xs text-gray-400">
                                            {new Date(discussion.createdAt).toLocaleDateString()} at {new Date(discussion.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                                    {discussion.content}
                                </p>

                                <div className="flex items-center gap-6 border-t border-white/5 pt-3">
                                    <button
                                        onClick={() => handleLike(discussion._id)}
                                        className={`flex items-center gap-2 text-sm transition-colors ${user && discussion.likes.includes(user.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'
                                            }`}
                                    >
                                        <span>❤️</span>
                                        <span>{discussion.likes.length}</span>
                                    </button>

                                    <button
                                        onClick={() => setReplyingTo(replyingTo === discussion._id ? null : discussion._id)}
                                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        <span>💬</span>
                                        <span>Reply</span>
                                    </button>
                                </div>

                                {/* Reply Input */}
                                {replyingTo === discussion._id && user && (
                                    <div className="mt-4 flex gap-3 animate-fadeIn">
                                        <input
                                            type="text"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Write a reply..."
                                            className="flex-1 bg-white/5 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleReply(discussion._id)}
                                            className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-500"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                )}

                                {/* Replies List */}
                                {discussion.replies && discussion.replies.length > 0 && (
                                    <div className="mt-4 pl-4 border-l-2 border-white/10 space-y-4">
                                        {discussion.replies.map((reply) => (
                                            <div key={reply._id} className="flex items-start gap-3">
                                                <img
                                                    src={reply.userId?.picture || `https://ui-avatars.com/api/?name=${reply.userId?.name}`}
                                                    alt={reply.userId?.name}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-white">{reply.userId?.name}</span>
                                                        <span className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 mt-1">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
