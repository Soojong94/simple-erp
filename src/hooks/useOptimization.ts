import { useMemo, useState, useEffect } from 'react'

/**
 * React.memo를 위한 비교 함수들
 */

// 거래 행 비교 함수
export const transactionRowEqual = (prevProps: any, nextProps: any) => {
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.transaction.total_amount === nextProps.transaction.total_amount &&
    prevProps.transaction.customer_name === nextProps.transaction.customer_name
  )
}

// 거래처 행 비교 함수  
export const customerRowEqual = (prevProps: any, nextProps: any) => {
  return (
    prevProps.customer.id === nextProps.customer.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.customer.name === nextProps.customer.name &&
    prevProps.customer.is_active === nextProps.customer.is_active
  )
}

// 상품 행 비교 함수
export const productRowEqual = (prevProps: any, nextProps: any) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.is_active === nextProps.product.is_active
  )
}

/**
 * 페이지네이션 훅
 */
export function usePagination<T>(data: T[], itemsPerPage: number = 50) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, itemsPerPage])
  
  const totalPages = Math.ceil(data.length / itemsPerPage)
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  
  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToNextPage = () => goToPage(currentPage + 1)
  const goToPrevPage = () => goToPage(currentPage - 1)
  
  return {
    paginatedData,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: data.length,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}

/**
 * 디바운스 검색 훅
 */
export function useDebounceSearch(searchTerm: string, delay: number = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [searchTerm, delay])
  
  return debouncedTerm
}

/**
 * React Query 최적화 설정
 */
export const optimizedQueryOptions = {
  // 캐시 시간 증가
  staleTime: 1000 * 60 * 10, // 10분
  gcTime: 1000 * 60 * 30,    // 30분 (구 cacheTime)
  
  // 리트라이 줄이기
  retry: 1,
  
  // 백그라운드 재패치 비활성화 (선택적)
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false
}
