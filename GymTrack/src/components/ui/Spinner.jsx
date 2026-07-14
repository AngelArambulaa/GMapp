export default function Spinner({ size = 6 }) {
  const px = { 4: 'w-4 h-4', 5: 'w-5 h-5', 6: 'w-6 h-6', 8: 'w-8 h-8', 10: 'w-10 h-10' }
  return (
    <div
      className={`${px[size] ?? 'w-6 h-6'} border-2 border-brand-500 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  )
}
