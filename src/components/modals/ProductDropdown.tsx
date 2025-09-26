import { useState, useRef, useEffect } from 'react'
import type { Product } from '../../types'

interface ProductDropdownProps {
  value: number
  products: Product[]
  frequentProducts: Product[]
  customerId: number
  onChange: (productId: number) => void
  onExclude: (productId: number) => void
}

export default function ProductDropdown({
  value,
  products,
  frequentProducts,
  customerId,
  onChange,
  onExclude
}: ProductDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 선택된 상품 찾기
  const selectedProduct = products.find(p => p.id === value)

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 상품 선택 핸들러
  const handleSelect = (productId: number) => {
    onChange(productId)
    setIsOpen(false)
    setShowAll(false) // 선택 후 다시 축소
  }

  // 제외 핸들러
  const handleExclude = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation() // 드롭다운 닫힘 방지
    if (confirm(`'${product.name}'을(를) 자주 거래하는 상품 목록에서 제외할까요?\n\n"전체 상품 보기"에서는 여전히 선택 가능합니다.`)) {
      onExclude(product.id!)
    }
  }

  // 카테고리 아이콘
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case '돼지고기': return '🐷'
      case '소고기': return '🐄'
      case '닭고기': return '🐔'
      case '오리고기': return '🦆'
      default: return '🍖'
    }
  }

  // 표시할 상품 목록 결정
  const displayProducts = showAll ? products : frequentProducts
  const hasFrequentProducts = frequentProducts.length > 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 선택된 값 표시 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center"
      >
        <span className={selectedProduct ? 'text-gray-900' : 'text-gray-500'}>
          {selectedProduct 
            ? `${getCategoryIcon(selectedProduct.category)} ${selectedProduct.name}`
            : '상품을 선택하세요'
          }
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {/* 자주 거래한 상품 섹션 */}
          {!showAll && hasFrequentProducts && (
            <>
              {frequentProducts.map(product => (
                <div
                  key={product.id}
                  className="group flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelect(product.id!)}
                >
                  <span className="flex-1">
                    ⭐ {getCategoryIcon(product.category)} {product.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleExclude(e, product)}
                    className="opacity-0 group-hover:opacity-100 text-orange-600 hover:text-orange-800 text-xs px-2 py-1 transition-opacity"
                    title="목록에서 제외"
                  >
                    ❌
                  </button>
                </div>
              ))}
              
              {/* 전체 상품 보기 버튼 */}
              <div
                className="px-3 py-2 border-t border-gray-200 hover:bg-gray-50 cursor-pointer text-blue-600 font-medium"
                onClick={() => setShowAll(true)}
              >
                ➕ 전체 상품 보기...
              </div>
            </>
          )}

          {/* 전체 상품 보기 모드 */}
          {showAll && (
            <>
              {/* 자주 거래한 상품 섹션 */}
              {hasFrequentProducts && (
                <>
                  <div className="px-3 py-1 bg-gray-100 text-xs text-gray-600 font-medium border-b border-gray-200">
                    ━━ 자주 거래한 상품 ━━
                  </div>
                  {frequentProducts.map(product => (
                    <div
                      key={`freq-${product.id}`}
                      className="group flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
                      onClick={() => handleSelect(product.id!)}
                    >
                      <span className="flex-1">
                        ⭐ {getCategoryIcon(product.category)} {product.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleExclude(e, product)}
                        className="opacity-0 group-hover:opacity-100 text-orange-600 hover:text-orange-800 text-xs px-2 py-1 transition-opacity"
                        title="목록에서 제외"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* 전체 상품 섹션 */}
              <div className="px-3 py-1 bg-gray-100 text-xs text-gray-600 font-medium border-y border-gray-200">
                ━━ 전체 상품 ━━
              </div>
              {products.filter(p => p.is_active).map(product => (
                <div
                  key={product.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelect(product.id!)}
                >
                  {getCategoryIcon(product.category)} {product.name}
                </div>
              ))}

              {/* 접기 버튼 */}
              {hasFrequentProducts && (
                <div
                  className="px-3 py-2 border-t border-gray-200 hover:bg-gray-50 cursor-pointer text-blue-600 font-medium"
                  onClick={() => setShowAll(false)}
                >
                  ⬆️ 자주 거래한 상품만 보기
                </div>
              )}
            </>
          )}

          {/* 거래 이력 없을 때는 바로 전체 상품 */}
          {!hasFrequentProducts && (
            <>
              {products.filter(p => p.is_active).map(product => (
                <div
                  key={product.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelect(product.id!)}
                >
                  {getCategoryIcon(product.category)} {product.name}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
