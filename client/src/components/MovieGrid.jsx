import MovieCard from './MovieCard'

export default function MovieGrid({ movies, title }) {
  if (movies.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400 text-xl">No movies found. Try another search.</p>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  )
}
