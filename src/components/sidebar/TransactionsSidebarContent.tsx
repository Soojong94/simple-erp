import { formatCurrency } from '../../lib/utils'
import PageSidebar, { 
  SidebarSection, 
  SidebarCard, 
  QuickActionButtons, 
  QuickActionButton,
  SidebarEmptyState 
} from './PageSidebar'
import type { Customer, Product } from '../../types'

interface TransactionsSidebarContentProps {
  customers?: Customer[]
  products?: Product[]
  onCustomerClick: (customerId: number) => void
  onProductClick: (productName: string) => void
  onQuickFilter: (filterType: 'today' | 'confirmed-sales' | 'confirmed-purchase' | 'draft') => void
  onResetFilters: () => void
}

export default function TransactionsSidebarContent({
  customers,
  products,
  onCustomerClick,
  onProductClick,
  onQuickFilter,
  onResetFilters
}: TransactionsSidebarContentProps) {
  return (
    <>
      {/* 최근 거래처 */}
      <SidebarSection title="📋 최근 거래처">
        {customers && customers.length > 0 ? (
          <div className="space-y-2">
            {customers
              .sort((a, b) => a.name.localeCompare(b.name))
              .slice(0, 8)
              .map(customer => (
                <SidebarCard
                  key={customer.id}
                  onClick={() => onCustomerClick(customer.id!)}
                  icon={customer.type === 'customer' ? '🛒' : '🏭'}
                  title={customer.name}
                  badge={{
                    text: customer.type === 'customer' ? '고객' : '공급업체',
                    className: customer.type === 'customer' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }}
                  subtitle={customer.phone?.slice(-4)}
                />
              ))
            }
          </div>
        ) : (
          <SidebarEmptyState icon="📝" message="거래처가 없습니다" />
        )}
      </SidebarSection>

      {/* 인기 상품 */}
      <SidebarSection title="🔥 인기 상품">
        {products && products.length > 0 ? (
          <div className="space-y-2">
            {products
              .filter(p => p.is_active)
              .sort((a, b) => a.name.localeCompare(b.name))
              .slice(0, 6)
              .map(product => (
                <SidebarCard
                  key={product.id}
                  onClick={() => onProductClick(product.name)}
                  icon={
                    product.category === '돼지고기' ? '🐷' :
                    product.category === '소고기' ? '🐄' :
                    product.category === '닭고기' ? '🐔' :
                    product.category === '오리고기' ? '🦆' : '🍖'
                  }
                  title={product.name}
                  badge={{
                    text: product.category,
                    className: 'bg-gray-100 text-gray-800'
                  }}
                  extra={product.unit_price ? formatCurrency(product.unit_price) : undefined}
                />
              ))
            }
          </div>
        ) : (
          <SidebarEmptyState icon="📝" message="상품이 없습니다" />
        )}
      </SidebarSection>

      {/* 빠른 액션 버튼들 */}
      <QuickActionButtons>
        <QuickActionButton
          onClick={() => onQuickFilter('today')}
          className="bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          📅 오늘 거래
        </QuickActionButton>
        
        <QuickActionButton
          onClick={() => onQuickFilter('confirmed-sales')}
          className="bg-green-100 text-green-700 hover:bg-green-200"
        >
          💰 확정 매출
        </QuickActionButton>
        
        <QuickActionButton
          onClick={() => onQuickFilter('confirmed-purchase')}
          className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
        >
          📦 확정 매입
        </QuickActionButton>
        
        <QuickActionButton
          onClick={() => onQuickFilter('draft')}
          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
        >
          ✏️ 임시저장
        </QuickActionButton>

        <QuickActionButton
          onClick={onResetFilters}
          className="mt-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          🔄 전체 보기
        </QuickActionButton>
      </QuickActionButtons>
    </>
  )
}
