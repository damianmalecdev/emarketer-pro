// Loading skeleton for tables
import { cn } from '@/lib/utils'

interface LoadingTableProps {
  rows?: number
  columns?: number
  className?: string
}

export function LoadingTable({ rows = 5, columns = 6, className }: LoadingTableProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header skeleton */}
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"
          />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`col-${colIndex}`}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"
              style={{
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}





