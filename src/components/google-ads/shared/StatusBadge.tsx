// Status badge component for Google Ads entities
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/google-ads/constants'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const colorClasses = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'gray'
  const label = STATUS_LABELS[status] || status
  const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}





