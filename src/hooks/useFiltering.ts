import { useState, useMemo } from 'react'

interface UseFilteringProps<T> {
  data: T[] | undefined
  filterFunctions: {
    [key: string]: (item: T, value: any) => boolean
  }
}

export function useFiltering<T>({
  data,
  filterFunctions
}: UseFilteringProps<T>) {
  const [filters, setFilters] = useState<Record<string, any>>({})

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true
        
        const filterFn = filterFunctions[key]
        if (!filterFn) return true
        
        return filterFn(item, value)
      })
    })
  }, [data, filters, filterFunctions])

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  return {
    filteredData,
    filters,
    updateFilter,
    clearFilters
  }
}
