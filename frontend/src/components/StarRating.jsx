export default function StarRating({ rating, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const textClass = size === 'sm' ? 'text-base' : 'text-xl';

  const colorClass =
    rating === 5
      ? 'text-green-500'
      : rating >= 3
      ? 'text-yellow-500'
      : 'text-red-400';

  return (
    <div className={`flex items-center ${colorClass}`}>
      <span className={`font-bold mr-1.5 ${textClass}`}>{rating}.0</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= rating ? '' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.487 7.02l6.568-.955L10 1l2.945 5.065 6.568.955-4.758 4.625 1.123 6.545z" />
        </svg>
      ))}
    </div>
  );
}
