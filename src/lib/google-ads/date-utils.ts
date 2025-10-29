// Date utility functions for Google Ads

/**
 * Get date range for last N days
 */
export function getLastNDays(days: number): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  return { startDate, endDate }
}

/**
 * Get date range for today
 */
export function getToday(): { startDate: Date; endDate: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return { 
    startDate: today, 
    endDate: new Date() 
  }
}

/**
 * Get date range for yesterday
 */
export function getYesterday(): { startDate: Date; endDate: Date } {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  const endOfYesterday = new Date(yesterday)
  endOfYesterday.setHours(23, 59, 59, 999)
  
  return { 
    startDate: yesterday, 
    endDate: endOfYesterday 
  }
}

/**
 * Get date range for this month
 */
export function getThisMonth(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date()
  
  return { startDate, endDate }
}

/**
 * Get date range for last month
 */
export function getLastMonth(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
  endDate.setHours(23, 59, 59, 999)
  
  return { startDate, endDate }
}

/**
 * Get date range for this year
 */
export function getThisYear(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), 0, 1)
  const endDate = new Date()
  
  return { startDate, endDate }
}

/**
 * Get date range preset by label
 */
export function getDateRangeByPreset(
  preset: string
): { startDate: Date; endDate: Date } {
  switch (preset) {
    case 'today':
      return getToday()
    case 'yesterday':
      return getYesterday()
    case 'last7days':
      return getLastNDays(7)
    case 'last14days':
      return getLastNDays(14)
    case 'last30days':
      return getLastNDays(30)
    case 'last90days':
      return getLastNDays(90)
    case 'thisMonth':
      return getThisMonth()
    case 'lastMonth':
      return getLastMonth()
    case 'thisYear':
      return getThisYear()
    default:
      return getLastNDays(30)
  }
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse ISO date string to Date
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean {
  return date < new Date()
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date): boolean {
  return date > new Date()
}

/**
 * Get number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get array of dates between start and end
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

/**
 * Group dates by week
 */
export function groupByWeek(dates: Date[]): Date[][] {
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  
  dates.forEach((date, index) => {
    currentWeek.push(date)
    
    // Start new week on Sunday or if last date
    if (date.getDay() === 0 || index === dates.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  
  return weeks
}

/**
 * Get week number of year
 */
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(0, 0, 0, 0)
  return newDate
}

/**
 * Get end of day
 */
export function endOfDay(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(23, 59, 59, 999)
  return newDate
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

/**
 * Subtract days from date
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days)
}





