import { useState } from 'react'
import { formatCurrency } from '../../lib/utils'
import type { TransactionItem, Product } from '../../types'

interface TransactionItemsListProps {
  items: TransactionItem[]
  products?: Product[]
  customerId: number
  frequentProducts?: Product[]  // 🎉 추가
  allTransactions?: any[]        // 🎉 추가 (통계 계산용)
  onAddItem: () => void
  onUpdateItem: (index: number, field: keyof TransactionItem, value: any) => void
  onRemoveItem: (index: number) => void
  onExclude?: (productId: number) => void  // 🎉 추가
}

export default function TransactionItemsList({
  items,
  products,
  customerId,
  frequentProducts,   // 🎉 추가
  allTransactions,    // 🎉 추가
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onExclude           // 🎉 추가
}: TransactionItemsListProps) {
  
  if (customerId === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-3">👆</div>
        <p>먼저 거래처를 선택해주세요</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-3">📦</div>
        <p>거래할 상품을 추가해주세요</p>
        <button
          type="button"
          onClick={onAddItem}
          className="mt-3 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          + 첫 번째 상품 추가
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <TransactionItemCard
          key={index}
          item={item}
          index={index}
          products={products}
          customerId={customerId}           // 🎉 추가
          frequentProducts={frequentProducts} // 🎉 추가
          allTransactions={allTransactions}    // 🎉 추가
          onUpdate={onUpdateItem}
          onRemove={onRemoveItem}
          onExclude={onExclude}             // 🎉 추가
        />
      ))}
      
      {/* 마지막 상품 아래 추가 버튼 */}
      <button
        type="button"
        onClick={onAddItem}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 font-medium"
      >
        + 상품 추가
      </button>
    </div>
  )
}

interface TransactionItemCardProps {
  item: TransactionItem
  index: number
  products?: Product[]
  customerId: number           // 🎉 추가
  frequentProducts?: Product[] // 🎉 추가
  allTransactions?: any[]      // 🎉 추가
  onUpdate: (index: number, field: keyof TransactionItem, value: any) => void
  onRemove: (index: number) => void
  onExclude?: (productId: number) => void  // 🎉 추가
}

function TransactionItemCard({ item, index, products, customerId, frequentProducts, allTransactions, onUpdate, onRemove, onExclude }: TransactionItemCardProps) {
  // 전체 상품 보기 모드 🎉
  const [showAllProducts, setShowAllProducts] = useState(false)
  
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-gray-900">상품 #{index + 1}</h4>
        <div className="flex space-x-2">
          {/* 상품 제외 버튼 🎉 */}
          {item.product_id > 0 && customerId > 0 && onExclude && (
            <button
              type="button"
              onClick={() => {
                const product = products?.find(p => p.id === item.product_id)
                if (product && confirm(`'${product.name}'을(를) 자주 거래하는 상품 목록에서 제외할까요?\n\n"전체 상품 보기"에서는 여전히 선택 가능합니다.`)) {
                  onExclude(item.product_id)
                  // 상품 초기화
                  onUpdate(index, 'product_id', 0)
                }
              }}
              className="text-orange-600 hover:text-orange-800 text-sm font-medium transition-colors"
              title="자주 거래하는 상품 목록에서 제외"
            >
              ❌ 목록에서 제외
            </button>
          )}
          
          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
          >
            ✕ 삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 상품 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상품 *
          </label>
          
          <select
            value={item.product_id}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (value === -999) {
                // "전체 상품 보기" 선택 시 토글
                setShowAllProducts(true)
                return
              }
              onUpdate(index, 'product_id', value)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={0}>상품을 선택하세요</option>
            
            {/* 자주 거래한 상품들 */}
            {customerId > 0 && frequentProducts && frequentProducts.length > 0 && !showAllProducts && (
              <>
                {frequentProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    ⭐ {getCategoryIcon(product.category)} {product.name}
                  </option>
                ))}
                <option value={-999} className="text-blue-600 font-medium">
                  ➕ 전체 상품 보기...
                </option>
              </>
            )}
            
            {/* 전체 상품 보기 모드 */}
            {(showAllProducts || (customerId > 0 && (!frequentProducts || frequentProducts.length === 0))) && (
              <>
                {showAllProducts && frequentProducts && frequentProducts.length > 0 && (
                  <optgroup label="━━ 자주 거래한 상품 ━━">
                    {frequentProducts.map(product => (
                      <option key={`freq-${product.id}`} value={product.id}>
                        ⭐ {getCategoryIcon(product.category)} {product.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {showAllProducts && frequentProducts && frequentProducts.length > 0 && (
                  <optgroup label="━━ 전체 상품 ━━">
                    {products?.filter(p => p.is_active).map(product => (
                      <option key={product.id} value={product.id}>
                        {getCategoryIcon(product.category)} {product.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {/* 거래 이력 없을 때는 바로 전체 */}
                {(!frequentProducts || frequentProducts.length === 0) && (
                  <>
                    {products?.filter(p => p.is_active).map(product => (
                      <option key={product.id} value={product.id}>
                        {getCategoryIcon(product.category)} {product.name}
                      </option>
                    ))}
                  </>
                )}
              </>
            )}
          </select>
          
          {/* 다시 자주 거래한 상품만 보기 버튼 */}
          {showAllProducts && frequentProducts && frequentProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAllProducts(false)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              ← 자주 거래한 상품만 보기
            </button>
          )}
        </div>

        {/* 수량 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            수량 *
          </label>
          <div className="flex">
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate(index, 'quantity', Number(e.target.value))}
              step="0.1"
              min="0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm">
              {item.unit}
            </span>
          </div>
        </div>

        {/* 단가 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            단가 *
          </label>
          <input
            type="number"
            value={item.unit_price}
            onChange={(e) => onUpdate(index, 'unit_price', Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="₩0"
          />
        </div>

        {/* 총액 (자동 계산) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            총액
          </label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-medium text-right">
            {formatCurrency(item.total_price)}
          </div>
        </div>
      </div>

      {/* 이력번호 (고기업 특화) */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🏷️ 이력번호 * (고기 유통업 필수)
        </label>
        <input
          type="text"
          value={item.traceability_number}
          onChange={(e) => onUpdate(index, 'traceability_number', e.target.value)}
          placeholder="예: 240925-001-123"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 상품 메모 (선택사항) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          상품 메모 (선택사항)
        </label>
        <input
          type="text"
          value={item.notes || ''}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
          placeholder="상품에 대한 추가 정보..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  )
}

// 카테고리에 따른 이모지 반환
function getCategoryIcon(category: string): string {
  switch (category) {
    case '돼지고기': return '🐷'
    case '소고기': return '🐄'
    case '닭고기': return '🐔'
    case '오리고기': return '🦆'
    default: return '🍖'
  }
}
