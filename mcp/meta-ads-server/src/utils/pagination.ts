import { MetaPagedResponse } from '../types/meta-api.types'

export interface PaginationOptions {
  limit?: number
  after?: string
  before?: string
}

export interface PaginatedResult<T> {
  data: T[]
  nextCursor?: string
  prevCursor?: string
  hasMore: boolean
}

/**
 * Extract pagination info from Meta API response
 */
export function extractPagination<T>(
  response: MetaPagedResponse<T>
): PaginatedResult<T> {
  return {
    data: response.data,
    nextCursor: response.paging?.cursors?.after,
    prevCursor: response.paging?.cursors?.before,
    hasMore: !!response.paging?.next,
  }
}

/**
 * Build query parameters for pagination
 */
export function buildPaginationParams(options: PaginationOptions): Record<string, string> {
  const params: Record<string, string> = {}

  if (options.limit) {
    params.limit = options.limit.toString()
  }

  if (options.after) {
    params.after = options.after
  }

  if (options.before) {
    params.before = options.before
  }

  return params
}

/**
 * Fetch all pages from a paginated endpoint
 */
export async function fetchAllPages<T>(
  fetchPage: (after?: string) => Promise<MetaPagedResponse<T>>,
  maxPages: number = 100
): Promise<T[]> {
  const allData: T[] = []
  let after: string | undefined
  let pageCount = 0

  while (pageCount < maxPages) {
    const response = await fetchPage(after)
    allData.push(...response.data)

    if (!response.paging?.cursors?.after || !response.paging?.next) {
      break
    }

    after = response.paging.cursors.after
    pageCount++
  }

  return allData
}

