interface LoadMoreButtonProps {
  onClick: () => void
  loading: boolean
}

export function LoadMoreButton({ onClick, loading }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center pt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="border-ink text-ink hover:bg-ink hover:text-paper rounded-full border px-8 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Load more articles'}
      </button>
    </div>
  )
}
