export default function WatchProviders({ providers }) {
    if (!providers || Object.keys(providers).length === 0) {
        return null
    }

    // Show only India region
    const regionData = providers['IN']

    if (!regionData) {
        return null
    }

    return (
        <div className="glass-strong p-8 rounded-2xl mb-8 animate-slideUp">
            <h2 className="text-2xl font-bold text-white mb-6 gradient-text">Where to Watch in India</h2>

            <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🇮🇳</span>
                    India
                </h3>

                {/* Streaming */}
                {regionData.flatrate && regionData.flatrate.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 uppercase font-semibold mb-2">Stream</p>
                        <div className="flex flex-wrap gap-3">
                            {regionData.flatrate.map((provider) => (
                                <div
                                    key={provider.provider_id}
                                    className="group relative"
                                    title={provider.provider_name}
                                >
                                    <div className="w-14 h-14 rounded-xl overflow-hidden glass-strong 
                                hover:scale-110 transition-transform duration-300 cursor-pointer
                                border-2 border-transparent hover:border-purple-500">
                                        {provider.logo_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                alt={provider.provider_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                📺
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                pointer-events-none">
                                        <div className="glass-strong px-3 py-1 rounded-lg whitespace-nowrap text-xs text-white">
                                            {provider.provider_name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rent */}
                {regionData.rent && regionData.rent.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-400 uppercase font-semibold mb-2">Rent</p>
                        <div className="flex flex-wrap gap-3">
                            {regionData.rent.map((provider) => (
                                <div
                                    key={provider.provider_id}
                                    className="group relative"
                                    title={provider.provider_name}
                                >
                                    <div className="w-14 h-14 rounded-xl overflow-hidden glass-strong 
                                hover:scale-110 transition-transform duration-300 cursor-pointer
                                border-2 border-transparent hover:border-cyan-500">
                                        {provider.logo_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                alt={provider.provider_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                💰
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                pointer-events-none">
                                        <div className="glass-strong px-3 py-1 rounded-lg whitespace-nowrap text-xs text-white">
                                            {provider.provider_name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Buy */}
                {regionData.buy && regionData.buy.length > 0 && (
                    <div>
                        <p className="text-sm text-gray-400 uppercase font-semibold mb-2">Buy</p>
                        <div className="flex flex-wrap gap-3">
                            {regionData.buy.map((provider) => (
                                <div
                                    key={provider.provider_id}
                                    className="group relative"
                                    title={provider.provider_name}
                                >
                                    <div className="w-14 h-14 rounded-xl overflow-hidden glass-strong 
                                hover:scale-110 transition-transform duration-300 cursor-pointer
                                border-2 border-transparent hover:border-green-500">
                                        {provider.logo_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                                alt={provider.provider_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                🛒
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                pointer-events-none">
                                        <div className="glass-strong px-3 py-1 rounded-lg whitespace-nowrap text-xs text-white">
                                            {provider.provider_name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* <p className="text-gray-400 text-xs mt-4">
                Availability data provided by JustWatch for India region.
            </p> */}
        </div>
    )
}
