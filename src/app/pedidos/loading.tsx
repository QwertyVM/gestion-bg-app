import { Skeleton } from '@/components/ui/skeleton'

export default function PedidosLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 p-4 rounded-xl border border-border/40 bg-card shadow-2xs flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-card border border-border/40 rounded-xl shadow-2xs flex flex-wrap gap-2.5 items-center justify-between">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border/40 rounded-xl shadow-2xs overflow-hidden">
        <div className="h-10 bg-muted/30 border-b border-border/40 px-4 flex items-center justify-between">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
        <div className="divide-y divide-border/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
