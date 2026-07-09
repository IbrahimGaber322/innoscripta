interface EmptyStateProps {
  title: string
  message: string
  children?: React.ReactNode
}

export function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 px-6 py-20 text-center">
      <h2 className="text-ink font-serif text-2xl font-medium">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500">
        {message}
      </p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
