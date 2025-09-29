import { useState, useMemo } from 'react'

/**
 * 페이지네이션 관리 훅
 * @param items 전체 데이터 배열
 * @param itemsPerPage 페이지당 표시할 항목 수 (기본: 50)
 * @returns 페이지네이션 관련 상태 및 함수
 */
export function usePagination<T>(items: T[], itemsPerPage = 50) {
  const [currentPage, setCurrentPage] = useState(1)
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil(items.length / itemsPerPage)
  
  // 현재 페이지의 데이터만 추출
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [items, currentPage, itemsPerPage])
  
  // 페이지 범위 계산 (현재 페이지 기준 ±2 페이지)
  const pageRange = useMemo(() => {
    const range: number[] = []
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    
    return range
  }, [currentPage, totalPages])
  
  // 페이지 이동 함수
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // 페이지 이동 시 스크롤을 맨 위로
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPrevPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)
  
  // 페이지 변경 시 currentPage 리셋 (필터 변경 등)
  const resetPage = () => setCurrentPage(1)
  
  return {
    // 데이터
    paginatedItems,
    
    // 상태
    currentPage,
    totalPages,
    totalItems: items.length,
    itemsPerPage,
    
    // 페이지 범위
    pageRange,
    
    // 네비게이션 가능 여부
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    
    // 현재 표시 범위
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, items.length),
    
    // 액션
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPrevPage,
    goToNextPage,
    resetPage
  }
}
