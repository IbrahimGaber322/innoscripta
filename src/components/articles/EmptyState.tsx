interface EmptyStateProps {
  title: string
  message: string
  children?: React.ReactNode
}

export function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
