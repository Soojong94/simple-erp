import { useState } from 'react'

/**
 * 확장 가능한 테이블 관리 훅
 * 한 번에 하나의 행만 확장 가능
 */
export function useExpandableTable() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const toggleRow = (id: number) => {
    // 같은 행을 클릭하면 축소, 다른 행을 클릭하면 해당 행만 확장
    setExpandedId(expandedId === id ? null : id)
  }

  const closeAll = () => {
    setExpandedId(null)
  }

  const isExpanded = (id: number) => {
    return expandedId === id
  }

  return {
    expandedId,
    toggleRow,
    closeAll,
    isExpanded
  }
}
