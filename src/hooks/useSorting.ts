import { useState, useMemo } from 'react'
import type { SortOrder } from '../types'

interface UseSortingProps<T> {
  data: T[] | undefined
  defaultSortBy: string
  defaultSortOrder?: SortOrder
  sortFunctions: {
    [key: string]: (a: T, b: T) => number
  }
}

export function useSorting<T>({
  data,
  defaultSortBy,
  defaultSortOrder = 'asc',
  sortFunctions
}: UseSortingProps<T>) {
  const [sortBy, setSortBy] = useState(defaultSortBy)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder)

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const sortFn = sortFunctions[sortBy]
    if (!sortFn) return data

    return [...data].sort((a, b) => {
      const comparison = sortFn(a, b)
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [data, sortBy, sortOrder, sortFunctions])

  return {
    sortedData,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  }
}
