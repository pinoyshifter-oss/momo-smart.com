/**
 * Placeholder for a dashboard page while its server data loads. Rendered by
 * the role `loading.tsx` files so a sidebar click responds instantly while the
 * layout (sidebar + topbar) stays in place.
 */
export function PageSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1400px] animate-pulse space-y-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-3">
        <div className="bg-line h-8 w-64 rounded-lg" />
        <div className="bg-line/70 h-4 w-full max-w-md rounded" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="border-line bg-surface h-28 rounded-2xl border"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="border-line bg-surface h-80 rounded-2xl border" />
        <div className="border-line bg-surface h-80 rounded-2xl border" />
      </div>
    </div>
  );
}
