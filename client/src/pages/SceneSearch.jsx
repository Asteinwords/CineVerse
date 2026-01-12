import { useState } from 'react';
import { Upload, Image, Video, FileText, X, Loader2, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import MovieGrid from '../components/MovieGrid';
import axios from 'axios';

export default function SceneSearch() {
    const [activeTab, setActiveTab] = useState('text');
    const [textInput, setTextInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [extractedAesthetics, setExtractedAesthetics] = useState(null);
    const [error, setError] = useState('');

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size
        const maxSize = activeTab === 'video' ? 50 : 10;
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File too large. Maximum size: ${maxSize}MB`);
            return;
        }

        setSelectedFile(file);
        setError('');

        // Create preview
        if (activeTab === 'image') {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else if (activeTab === 'video') {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleTextSearch = async () => {
        if (!textInput.trim()) {
            setError('Please enter a description');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/scene-search/text`,
                { description: textInput, limit: 20 }
            );

            setResults(response.data.results);
        } catch (err) {
            setError(err.response?.data?.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSearch = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        setExtractedAesthetics(null);

        const formData = new FormData();
        formData.append(activeTab, selectedFile);

        try {
            const endpoint = activeTab === 'image' ? 'image' : 'video';
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/scene-search/${endpoint}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            // Handle new API response structure
            const data = response.data;

            // Combine identified movie and alternative results
            const allResults = [];
            if (data.identifiedMovie) {
                allResults.push(data.identifiedMovie);
            }
            if (data.alternativeResults && Array.isArray(data.alternativeResults)) {
                allResults.push(...data.alternativeResults);
            }

            setResults(allResults);

            // Set extracted aesthetics if available
            if (data.extractedAesthetics) {
                setExtractedAesthetics(data.extractedAesthetics);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (activeTab === 'text') {
            handleTextSearch();
        } else {
            handleFileSearch();
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreview(null);
    };

    const examplePrompts = [
        "Dark rainy cyberpunk city with neon lights, melancholic atmosphere",
        "Warm sunset, nostalgic summer vibes, coming-of-age story",
        "Intense action, explosive car chases, gritty urban setting",
        "Peaceful countryside, slow-paced, meditative and calm"
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            {/* Hero Section */}
            <header className="pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/20 border border-purple-500/30 mb-4">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-purple-300">AI-Powered Vibe Search</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold">
                            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                                Find Movies by Vibe
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Upload a scene, describe an aesthetic, or share a video clip — AI will find movies that match the vibe
                        </p>
                    </div>
                </div>
            </header>

            {/* Search Interface */}
            <main className="pb-20">
                <div className="max-w-5xl mx-auto px-6">
                    {/* Tab Selector */}
                    <div className="flex justify-center gap-4 mb-8">
                        {[
                            { id: 'text', icon: FileText, label: 'Text Description' },
                            { id: 'image', icon: Image, label: 'Upload Image' },
                            { id: 'video', icon: Video, label: 'Upload Video' }
                        ].map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    setActiveTab(id);
                                    setError('');
                                    setResults([]);
                                    setExtractedAesthetics(null);
                                }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${activeTab === id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                        {activeTab === 'text' && (
                            <div className="space-y-4">
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Describe the vibe, aesthetic, or scene you're looking for...&#10;&#10;Example: 'Dark rainy cyberpunk city with neon lights, melancholic atmosphere, slow synthwave music'"
                                    className="w-full h-40 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                                />

                                {/* Example Prompts */}
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-400">Try these examples:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {examplePrompts.map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setTextInput(prompt)}
                                                className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 transition-all"
                                            >
                                                {prompt.substring(0, 40)}...
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'image' || activeTab === 'video') && (
                            <div className="space-y-4">
                                {!selectedFile ? (
                                    <label className="block cursor-pointer">
                                        <input
                                            type="file"
                                            accept={activeTab === 'image' ? 'image/*' : 'video/*'}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-purple-500 transition-all">
                                            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                            <p className="text-gray-300 mb-2">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {activeTab === 'image'
                                                    ? 'PNG, JPG, WebP (max 10MB)'
                                                    : 'MP4, WebM (max 50MB, 30s)'}
                                            </p>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="relative">
                                        {activeTab === 'image' && preview && (
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="w-full max-h-96 object-contain rounded-xl"
                                            />
                                        )}
                                        {activeTab === 'video' && preview && (
                                            <video
                                                src={preview}
                                                controls
                                                className="w-full max-h-96 rounded-xl"
                                            />
                                        )}
                                        <button
                                            onClick={clearFile}
                                            className="absolute top-2 right-2 w-8 h-8 bg-black/80 hover:bg-black rounded-full flex items-center justify-center"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <p className="text-sm text-gray-400 mt-2">{selectedFile.name}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            disabled={loading || (activeTab === 'text' ? !textInput.trim() : !selectedFile)}
                            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing with AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Find Matching Movies
                                </>
                            )}
                        </button>
                    </div>

                    {/* Extracted Aesthetics */}
                    {extractedAesthetics && (
                        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                AI Extracted Aesthetics
                            </h3>
                            <p className="text-gray-300 mb-4">{extractedAesthetics.description}</p>
                            {extractedAesthetics.colors && extractedAesthetics.colors.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Color Palette:</span>
                                    {extractedAesthetics.colors.map((color, i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-full border-2 border-white/20"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            )}
                            {extractedAesthetics.emotionalTones && extractedAesthetics.emotionalTones.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {extractedAesthetics.emotionalTones.map((tone, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                                        >
                                            {tone}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results */}
                    {results && results.length > 0 && (
                        <div className="mt-12">
                            {/* AI Identified Movie */}
                            {results[0]?.aiIdentified && (
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-6">
                                        <h2 className="text-3xl font-bold">Identified Movie</h2>
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${results[0].confidence === 'high'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : results[0].confidence === 'medium'
                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                            }`}>
                                            {results[0].confidence.toUpperCase()} Confidence
                                        </span>
                                    </div>

                                    {/* Identified Movie Card */}
                                    <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border-2 border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
                                        <div className="flex gap-6">
                                            {results[0].poster && (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w500${results[0].poster}`}
                                                    alt={results[0].title}
                                                    className="w-48 h-72 object-cover rounded-xl shadow-2xl"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold mb-2">{results[0].title}</h3>
                                                {results[0].releaseDate && (
                                                    <p className="text-gray-400 mb-4">
                                                        {new Date(results[0].releaseDate).getFullYear()}
                                                    </p>
                                                )}
                                                {results[0].rating && (
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="text-yellow-400">★</span>
                                                        <span className="text-white font-medium">{results[0].rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                                {results[0].overview && (
                                                    <p className="text-gray-300 mb-4 line-clamp-3">{results[0].overview}</p>
                                                )}

                                                {/* AI Analysis Details */}
                                                {results[0].scene && (
                                                    <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/10">
                                                        <p className="text-sm text-gray-400 mb-2">Scene Description:</p>
                                                        <p className="text-gray-300">{results[0].scene}</p>
                                                    </div>
                                                )}

                                                {results[0].characters && results[0].characters.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="text-sm text-gray-400">Characters:</span>
                                                        {results[0].characters.map((char, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                                                            >
                                                                {char}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {results[0].reasoning && (
                                                    <details className="mt-4">
                                                        <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">
                                                            How did AI identify this?
                                                        </summary>
                                                        <p className="text-sm text-gray-400 mt-2 pl-4">{results[0].reasoning}</p>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Similar Movies */}
                            {(results.length > 1 || (results.length === 1 && !results[0].aiIdentified)) && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-3xl font-bold">
                                            {results[0]?.aiIdentified ? 'Similar Movies' : 'Matching Movies'}
                                        </h2>
                                        <span className="text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-full">
                                            {results[0]?.aiIdentified ? results.length - 1 : results.length} results
                                        </span>
                                    </div>
                                    <MovieGrid movies={results[0]?.aiIdentified ? results.slice(1) : results} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && (!results || results.length === 0) && !extractedAesthetics && (
                        <div className="mt-20 text-center">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600/20 to-transparent border border-purple-600/30 mb-6">
                                <Sparkles className="w-12 h-12 text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-medium text-gray-400 mb-2">
                                Ready to discover movies by vibe
                            </h3>
                            <p className="text-gray-500">
                                Describe a scene, upload an image, or share a video clip to get started
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
