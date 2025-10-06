/**
 * Retry Utility
 * 
 * Provides retry logic for API calls with exponential backoff.
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  onRetry: () => {},
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === opts.maxAttempts) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      )

      opts.onRetry(attempt, lastError)

      console.log(
        `Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms`
      )

      await sleep(delay)
    }
  }

  throw lastError || new Error('Retry failed')
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if an error is retryable (e.g., network errors, rate limits)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true
  }

  // HTTP status codes that should be retried
  if (error.response?.status) {
    const status = error.response.status
    return status === 429 || status >= 500
  }

  return false
}

/**
 * Retry only if the error is retryable
 */
export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    onRetry: (attempt, error) => {
      if (!isRetryableError(error)) {
        throw error
      }
      options.onRetry?.(attempt, error)
    },
  })
}

