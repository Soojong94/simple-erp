# Hooks

커스텀 React Hooks 모음

## 훅 목록

```
hooks/
├── useChartData.ts          # 차트 데이터 처리
├── useExpandableTable.ts    # 확장형 테이블
└── usePagination.ts         # 페이지네이션
```

## 훅 상세

### usePagination.ts
페이지네이션 로직 관리

**사용 목적**
- 대량 데이터를 페이지 단위로 분할
- 페이지 이동 로직
- 페이지 범위 계산

**시그니처**
```typescript
function usePagination<T>(
  items: T[],
  itemsPerPage?: number
): UsePaginationReturn<T>
```

**반환값**
```typescript
interface UsePaginationReturn<T> {
  paginatedItems: T[]        // 현재 페이지 아이템
  currentPage: number        // 현재 페이지 번호
  totalPages: number         // 전체 페이지 수
  totalItems: number         // 전체 아이템 수
  pageRange: number[]        // 표시할 페이지 번호 배열
  hasNextPage: boolean       // 다음 페이지 존재 여부
  hasPrevPage: boolean       // 이전 페이지 존재 여부
  startIndex: number         // 현재 페이지 시작 인덱스 (1-based)
  endIndex: number           // 현재 페이지 끝 인덱스
  goToPage: (page: number) => void       // 특정 페이지로 이동
  goToNextPage: () => void               // 다음 페이지
  goToPrevPage: () => void               // 이전 페이지
  goToFirstPage: () => void              // 첫 페이지
  goToLastPage: () => void               // 마지막 페이지
  resetPage: () => void                  // 1페이지로 리셋
}
```

**사용 예시**
```typescript
import { usePagination } from '@/hooks/usePagination'

function CustomerList() {
  const { data: customers } = useQuery(['customers'])
  
  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage
  } = usePagination(customers, 50) // 페이지당 50개
  
  return (
    <div>
      {paginatedItems.map(customer => (
        <CustomerCard key={customer.id} data={customer} />
      ))}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </div>
  )
}
```

**페이지 범위 계산**
```typescript
// 현재 페이지 ±2 범위 표시
// 예: 현재 5페이지 → [3, 4, 5, 6, 7]
const pageRange = useMemo(() => {
  const range: number[] = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)
  
  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  
  return range
}, [currentPage, totalPages])
```

**필터 변경 시 리셋**
```typescript
useEffect(() => {
  resetPage() // 검색/필터 변경 시 1페이지로
}, [searchQuery, filterValue])
```

### useExpandableTable.ts
확장 가능한 테이블 행 관리

**사용 목적**
- 행 확장/축소 상태 관리
- 다중 행 확장 지원
- 애니메이션 처리

**시그니처**
```typescript
function useExpandableTable(
  defaultExpandAll?: boolean
): UseExpandableTableReturn
```

**반환값**
```typescript
interface UseExpandableTableReturn {
  expandedRows: Set<number>              // 확장된 행 ID 집합
  isRowExpanded: (id: number) => boolean // 특정 행 확장 여부
  toggleRow: (id: number) => void        // 행 토글
  expandRow: (id: number) => void        // 행 확장
  collapseRow: (id: number) => void      // 행 축소
  expandAll: () => void                  // 전체 확장
  collapseAll: () => void                // 전체 축소
}
```

**사용 예시**
```typescript
import { useExpandableTable } from '@/hooks/useExpandableTable'

function TransactionTable({ transactions }) {
  const {
    expandedRows,
    isRowExpanded,
    toggleRow
  } = useExpandableTable()
  
  return (
    <table>
      {transactions.map(tx => (
        <React.Fragment key={tx.id}>
          {/* 기본 행 */}
          <tr onClick={() => toggleRow(tx.id)}>
            <td>{tx.transaction_number}</td>
            <td>{tx.customer_name}</td>
            <td>
              {isRowExpanded(tx.id) ? '▼' : '▶'}
            </td>
          </tr>
          
          {/* 확장 행 */}
          {isRowExpanded(tx.id) && (
            <tr className="expanded-row">
              <td colSpan={3}>
                <div className="expanded-content">
                  {/* 상세 정보 */}
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
    </table>
  )
}
```

**전체 확장/축소**
```typescript
<div className="actions">
  <button onClick={expandAll}>모두 펼치기</button>
  <button onClick={collapseAll}>모두 접기</button>
</div>
```

### useChartData.ts
차트 데이터 가공 및 포맷팅

**사용 목적**
- 거래 데이터를 차트 형식으로 변환
- 날짜별/카테고리별 집계
- 통계 계산

**시그니처**
```typescript
function useChartData(
  transactions: TransactionWithItems[]
): UseChartDataReturn
```

**반환값**
```typescript
interface UseChartDataReturn {
  // 일별 매출 데이터
  dailySalesData: Array<{
    date: string
    sales: number
    purchase: number
  }>
  
  // 상위 거래처 데이터
  topCustomersData: Array<{
    name: string
    amount: number
  }>
  
  // 카테고리별 매출
  categoryData: Array<{
    category: string
    amount: number
  }>
  
  // 통계
  stats: {
    totalSales: number
    totalPurchase: number
    profit: number
    avgTransactionValue: number
  }
}
```

**사용 예시**
```typescript
import { useChartData } from '@/hooks/useChartData'

function Dashboard() {
  const { data: transactions } = useQuery(['transactions'])
  const { dailySalesData, topCustomersData, stats } = useChartData(transactions)
  
  return (
    <div>
      <StatsCard data={stats} />
      <DailySalesChart data={dailySalesData} />
      <TopCustomersChart data={topCustomersData} />
    </div>
  )
}
```

**데이터 가공 로직**
```typescript
// 일별 집계
const dailySalesData = useMemo(() => {
  const grouped = groupBy(transactions, tx => 
    format(new Date(tx.transaction_date), 'yyyy-MM-dd')
  )
  
  return Object.entries(grouped).map(([date, txs]) => ({
    date,
    sales: sum(txs.filter(t => t.type === 'sales').map(t => t.total_amount)),
    purchase: sum(txs.filter(t => t.type === 'purchase').map(t => t.total_amount))
  }))
}, [transactions])

// 상위 거래처
const topCustomersData = useMemo(() => {
  const grouped = groupBy(transactions, 'customer_id')
  
  return Object.entries(grouped)
    .map(([customerId, txs]) => ({
      name: txs[0].customer_name,
      amount: sum(txs.map(t => t.total_amount))
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10) // 상위 10개
}, [transactions])
```

## 커스텀 훅 작성 가이드

### 기본 구조

```typescript
import { useState, useEffect, useMemo } from 'react'

export function useCustomHook(param: string) {
  const [state, setState] = useState<SomeType>()
  
  useEffect(() => {
    // 사이드 이펙트
  }, [param])
  
  const computed = useMemo(() => {
    // 복잡한 계산
  }, [state])
  
  const handler = () => {
    // 핸들러 함수
  }
  
  return {
    state,
    computed,
    handler
  }
}
```

### 네이밍 컨벤션

```typescript
// ✅ 좋은 예
useUserData()
usePagination()
useExpandableTable()

// ❌ 나쁜 예
getUserData()  // use 접두사 없음
usePaging()    // 불명확한 이름
useTable()     // 너무 일반적
```

### 타입 정의

```typescript
interface UseCustomHookOptions {
  initialValue?: string
  onChange?: (value: string) => void
}

interface UseCustomHookReturn {
  value: string
  setValue: (value: string) => void
  reset: () => void
}

export function useCustomHook(
  options?: UseCustomHookOptions
): UseCustomHookReturn {
  // 구현
}
```

### 의존성 배열 주의

```typescript
// ❌ 나쁜 예 - 무한 루프
useEffect(() => {
  setState({ value: 123 }) // 객체 새로 생성
}, [state]) // state 변경 → 리렌더 → 새 객체 → 무한

// ✅ 좋은 예
useEffect(() => {
  setState(prev => ({ ...prev, value: 123 }))
}, []) // 마운트 시 1회만
```

### 메모이제이션 활용

```typescript
// 복잡한 계산은 useMemo로
const expensive = useMemo(() => {
  return items
    .filter(/* 복잡한 필터 */)
    .map(/* 복잡한 변환 */)
    .sort(/* 복잡한 정렬 */)
}, [items])

// 함수는 useCallback으로
const handleClick = useCallback(() => {
  console.log(value)
}, [value])
```

### 클린업 처리

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething()
  }, 1000)
  
  // 클린업 함수
  return () => {
    clearTimeout(timer)
  }
}, [])
```

## 테스트

```typescript
import { renderHook, act } from '@testing-library/react'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('페이지 이동이 정상 작동', () => {
    const items = Array.from({ length: 100 }, (_, i) => i)
    const { result } = renderHook(() => usePagination(items, 10))
    
    expect(result.current.currentPage).toBe(1)
    expect(result.current.paginatedItems.length).toBe(10)
    
    act(() => {
      result.current.goToPage(2)
    })
    
    expect(result.current.currentPage).toBe(2)
  })
})
```

## 성능 최적화 팁

### 1. 불필요한 리렌더 방지

```typescript
// React.memo로 컴포넌트 메모이제이션
const MemoizedComponent = React.memo(Component)

// useMemo로 값 메모이제이션
const value = useMemo(() => expensiveCalc(), [deps])

// useCallback으로 함수 메모이제이션
const fn = useCallback(() => doSomething(), [deps])
```

### 2. 대용량 데이터 처리

```typescript
// 페이지네이션 필수
const { paginatedItems } = usePagination(largeArray, 50)

// 가상화 고려 (react-window)
import { FixedSizeList } from 'react-window'
```

### 3. 디바운싱

```typescript
import { debounce } from '@/lib/utils'

const debouncedHandler = useMemo(
  () => debounce(handler, 300),
  [handler]
)
```

## 관련 문서

- [컴포넌트 가이드](../components/README.md)
- [유틸리티 함수](../lib/README.md)
- [타입 정의](../types/README.md)
