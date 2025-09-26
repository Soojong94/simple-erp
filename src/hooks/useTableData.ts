import { useMemo } from 'react'
import { useFiltering } from './useFiltering'
import { useSorting } from './useSorting'
import type { SortOrder } from '../types'

interface UseTableDataProps<T> {
  data: T[] | undefined
  filterFunctions: {
    [key: string]: (item: T, value: any) => boolean
  }
  sortFunctions: {
    [key: string]: (a: T, b: T) => number
  }
  defaultSortBy: string
  defaultSortOrder?: SortOrder
}

export function useTableData<T>({
  data,
  filterFunctions,
  sortFunctions,
  defaultSortBy,
  defaultSortOrder = 'asc'
}: UseTableDataProps<T>) {
  // 필터링
  const {
    filteredData,
    filters,
    updateFilter,
    clearFilters
  } = useFiltering({
    data,
    filterFunctions
  })

  // 정렬
  const {
    sortedData,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  } = useSorting({
    data: filteredData,
    defaultSortBy,
    defaultSortOrder,
    sortFunctions
  })

  return {
    // 최종 데이터
    tableData: sortedData,
    
    // 필터 관련
    filters,
    updateFilter,
    clearFilters,
    
    // 정렬 관련
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
  }
}
