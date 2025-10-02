# Inventory Components

✅ **실제 사용 중** - Inventory 페이지에서 활용

재고 관리를 위한 컴포넌트 모음

## 📌 사용 위치

**Inventory.tsx** 페이지에서 사용
```typescript
import InventoryTable from '../components/inventory/InventoryTable'
import StockMovementModal from '../components/inventory/StockMovementModal'
import ExpiryAlertCard from '../components/inventory/ExpiryAlertCard'
```

**주의**: `InventoryOverview.tsx`는 구현되어 있지만 현재 페이지에서 사용되지 않음

---

## 📋 파일 목록

### 1. InventoryTable.tsx ✅ 사용 중

**역할**: 상품별 재고 현황 테이블 + 이동 이력

**주요 기능**

1. **재고 현황 표시**
   - 상품 정보 (이름, 카테고리, 코드)
   - 현재 재고, 안전 재고
   - 보관 위치 (냉동/냉장/상온)
   - 재고 상태 (품절/위험/부족/정상)

2. **필터링**
   - 검색어 (상품명, 코드, 카테고리)
   - 재고 상태별 (전체/재고 부족/정상 재고)

3. **확장 행**
   - 클릭하면 최근 재고 이동 이력 표시 (최대 5건)
   - 일시, 구분, 수량, 로트, 이력번호, 비고

4. **페이지네이션**
   - 페이지당 50개 항목
   - Pagination 컴포넌트 사용

**Props**
```typescript
interface InventoryTableProps {
  onStockMovement: (product: Product & ProductInventory) => void
}
```

**데이터 병합**
```typescript
// 상품 + 재고 데이터 결합
const combinedData = useMemo(() => {
  return products.map(product => {
    const inv = inventory.find(i => i.product_id === product.id) || {
      product_id: product.id,
      current_stock: 0,
      safety_stock: 30,
      location: 'cold',
      last_updated: new Date().toISOString()
    }
    return { ...product, ...inv }
  })
}, [products, inventory])
```

**재고 상태 판단**
```typescript
const getStockStatus = (current: number, safety: number) => {
  const ratio = current / safety
  if (ratio === 0) return { color: 'text-red-600', bg: 'bg-red-50', text: '품절', icon: '❌' }
  if (ratio < 0.5) return { color: 'text-red-600', bg: 'bg-red-50', text: '위험', icon: '⚠️' }
  if (ratio < 1) return { color: 'text-yellow-600', bg: 'bg-yellow-50', text: '부족', icon: '⚡' }
  return { color: 'text-green-600', bg: 'bg-green-50', text: '정상', icon: '✅' }
}
```

**보관 위치 표시**
```typescript
const getLocationLabel = (location?: string) => {
  switch (location) {
    case 'frozen': return '❄️ 냉동'
    case 'cold': return '🧊 냉장'
    case 'room': return '🌡️ 상온'
    default: return '🧊 냉장'
  }
}
```

---

### 2. StockMovementModal.tsx ✅ 사용 중

**역할**: 재고 입고/출고/조정 처리 모달

**주요 기능**

1. **입고 처리**
   - 수량 입력
   - 로트번호 자동 생성 (LOT-날짜-상품ID-랜덤코드)
   - 유통기한 자동 계산 (입고일 + N일)
   - 이력번호 자동 채우기
   - 로트 생성

2. **출고 처리 (FIFO)**
   - 현재 재고 확인
   - 활성 로트에서 선입선출로 차감
   - 로트 부족 시 나머지는 일반 출고
   - 재고 부족 시 에러

3. **재고 조정**
   - 실사 후 차이 보정
   - 입력 수량 = 최종 재고량

**Props**
```typescript
interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  product: (Product & ProductInventory) | null
}
```

**탭 구성**
```typescript
const [activeTab, setActiveTab] = useState<'in' | 'out' | 'adjust'>('in')

// 📥 입고: 녹색
// 📤 출고: 빨간색
// 🔧 재고조정: 파란색
```

**로트번호 자동 생성**
```typescript
if (activeTab === 'in') {
  const today = new Date().toISOString().split('T')[0]
  const randomCode = Math.random().toString(36).substr(2, 4).toUpperCase()
  setFormData(prev => ({
    ...prev,
    lot_number: `LOT-${today}-${product.id}-${randomCode}`,
    traceability_number: product.traceability_number || ''
  }))
}
```

**유통기한 자동 계산**
```typescript
const [expiryDays, setExpiryDays] = useState(7) // 기본 7일

useEffect(() => {
  if (activeTab === 'in' && expiryDays > 0) {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)
    setFormData(prev => ({
      ...prev,
      expiry_date: expiryDate.toISOString().split('T')[0]
    }))
  }
}, [expiryDays, activeTab])
```

**출고 로직 (FIFO)**
```typescript
// 1. 현재 재고 확인
if (inventory.current_stock < data.quantity!) {
  throw new Error(`재고가 부족합니다. 현재 재고: ${inventory.current_stock}kg`)
}

// 2. 활성 로트에서 선입선출
const activeLots = await inventoryAPI.getActiveLots(productId)
let remainingQty = data.quantity!

for (const lot of activeLots) {
  if (remainingQty <= 0) break
  
  const deductQty = Math.min(remainingQty, lot.remaining_quantity)
  
  // 로트에서 차감
  await inventoryAPI.updateLot(lot.id, {
    remaining_quantity: lot.remaining_quantity - deductQty
  })
  
  // 재고 이동 기록
  await inventoryAPI.createMovement({
    ...data,
    quantity: deductQty,
    lot_number: lot.lot_number
  })
  
  remainingQty -= deductQty
}

// 3. 로트 부족 시 나머지를 일반 출고
if (remainingQty > 0) {
  await inventoryAPI.createMovement({
    ...data,
    quantity: remainingQty,
    lot_number: undefined,
    notes: `${data.notes || ''} (로트 불명 출고)`.trim()
  })
}
```

**쿼리 무효화**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
  queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
  queryClient.invalidateQueries({ queryKey: ['stock-lots'] })
  alert('재고 이동이 완료되었습니다.')
}
```

---

### 3. ExpiryAlertCard.tsx ✅ 사용 중

**역할**: 유통기한 임박 알림 카드

**주요 기능**

1. **유통기한 모니터링**
   - 향후 3일 내 만료 로트 조회
   - 1분마다 자동 새로고침

2. **긴급도 표시**
   - D-day 계산
   - 만료: 빨간색
   - D-1: 주황색
   - D-2, D-3: 노란색

3. **로트 정보**
   - 상품명
   - 로트번호
   - 남은 수량
   - 공급처 (있는 경우)
   - 유통기한

**현재 상태**
```typescript
// ⚠️ TODO: getExpiringLots 메서드 미구현
// 현재는 빈 배열 반환
const { data: expiringLots = [] } = useQuery({
  queryKey: ['expiring-lots'],
  queryFn: async () => {
    return [] // 임시
  },
  refetchInterval: 60000
})
```

**D-day 계산**
```typescript
const getDaysRemaining = (expiryDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
```

**긴급도 스타일**
```typescript
const urgencyClass = daysRemaining <= 0 ? 'bg-red-100 text-red-800' :
                    daysRemaining === 1 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
```

---

### 4. InventoryOverview.tsx ⚠️ 미사용

**역할**: 재고 현황 요약 카드 (6개 통계 카드)

**표시 정보**
1. 총 재고량 (kg)
2. 재고 부족 개수
3. 유통기한 임박 개수
4. 만료된 로트 개수
5. 관리 상품 개수
6. 재고 총액

**현재 상태**
- ✅ 코드는 완성
- ❌ Inventory.tsx에서 import 안 함
- ❌ 사용자에게 노출 안 됨

**사용하려면**
```typescript
// Inventory.tsx에 추가
import InventoryOverview from '../components/inventory/InventoryOverview'

// 렌더링
<div className="mb-8">
  <InventoryOverview />
</div>
```

---

## 🔄 데이터 흐름

### Inventory 페이지
```typescript
1. 유통기한 지난 로트 자동 처리
   inventoryAPI.processExpiredLots()

2. 재고 데이터 초기화 (필요시)
   - 기존 거래에서 재고 계산
   - ProductInventory 생성

3. 컴포넌트 렌더링
   - ExpiryAlertCard: 유통기한 알림
   - InventoryTable: 재고 현황 테이블
   - StockMovementModal: 입출고 모달
```

### 재고 이동 프로세스
```typescript
1. 사용자: InventoryTable에서 "입출고" 버튼 클릭
2. Inventory: onStockMovement(product) 호출
3. Inventory: StockMovementModal 열기
4. 사용자: 모달에서 입고/출고/조정 선택 및 입력
5. Modal: mutation.mutate(formData)
6. API: inventoryAPI.createMovement() 호출
7. Modal: 쿼리 무효화 → 테이블 자동 갱신
8. Modal: 닫기
```

---

## 🔧 의존성

### 외부 라이브러리
```typescript
import { useState, useEffect, useMemo, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
```

### 내부 모듈
```typescript
// API
import { inventoryAPI, productAPI } from '../../lib/tauri'

// Hooks
import { useExpandableTable } from '../../hooks/useExpandableTable'
import { usePagination } from '../../hooks/usePagination'

// 컴포넌트
import Pagination from '../Pagination'

// 유틸리티
import { formatNumber, formatCurrency, cn } from '../../lib/utils'

// 타입
import type { ProductInventory, Product, StockMovement, StockLot, InventoryStats } from '../../types'
```

---

## 🎯 주요 특징

### 1. 실시간 재고 관리
- 입고/출고 즉시 반영
- React Query로 자동 갱신
- 낙관적 업데이트 없음 (안정성 우선)

### 2. FIFO 출고
- 선입선출 자동 처리
- 로트별 수량 추적
- 유통기한 순서 보장

### 3. 로트 추적
- 입고 시 자동 로트 생성
- 출고 시 로트 연결
- 이력번호 관리

### 4. 유통기한 관리
- 자동 계산 (입고일 + N일)
- 만료 임박 알림
- 만료 로트 자동 처리

### 5. 재고 상태 시각화
- 색상으로 구분 (품절/위험/부족/정상)
- 아이콘 표시
- 진행률 표시 (현재/안전)

---

## 💡 사용 예시

### Inventory 페이지
```typescript
import InventoryTable from '../components/inventory/InventoryTable'
import StockMovementModal from '../components/inventory/StockMovementModal'
import ExpiryAlertCard from '../components/inventory/ExpiryAlertCard'

export default function Inventory() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const handleStockMovement = (product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }
  
  return (
    <div>
      {/* 유통기한 알림 */}
      <ExpiryAlertCard />
      
      {/* 재고 테이블 */}
      <InventoryTable onStockMovement={handleStockMovement} />
      
      {/* 입출고 모달 */}
      <StockMovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  )
}
```

---

## ⚠️ 주의사항

### 1. ExpiryAlertCard
- `getExpiringLots` 메서드 미구현
- 현재 빈 배열 반환
- TODO 주석 참고

### 2. 재고 초기화
- Inventory 페이지에서 자동 처리
- 기존 거래에서 재고 계산
- 한 번만 실행됨

### 3. FIFO 출고
- 로트가 없으면 일반 출고로 처리
- "로트 불명 출고" 메모 자동 추가
- 재고는 정확히 차감됨

### 4. 유통기한
- 기본 7일로 설정
- 사용자가 변경 가능
- 입고일 기준 자동 계산

### 5. 재고 조정
- 입력 수량 = 최종 재고량
- 실사 후 사용
- 주의 메시지 표시

---

## 📝 개선 아이디어

1. **InventoryOverview 활성화**
   - Inventory 페이지에 추가
   - 대시보드 같은 느낌

2. **유통기한 알림 구현**
   - `inventoryAPI.getExpiringLots()` 구현
   - 실제 데이터 표시

3. **바코드 스캔**
   - 입출고 시 바코드 스캔
   - 로트번호 자동 입력

4. **재고 이력 상세**
   - 전체 이력 조회 페이지
   - 필터링, 검색

5. **재고 알림**
   - 안전 재고 이하 시 알림
   - 이메일/푸시 알림

6. **일괄 처리**
   - 여러 상품 동시 입출고
   - Excel 업로드

7. **재고 실사**
   - 실사 모드
   - 차이 자동 계산
   - 조정 일괄 처리

---

## 🐛 알려진 이슈

1. **ExpiryAlertCard**
   - `getExpiringLots` 미구현
   - 항상 "유통기한 안전" 표시

2. **InventoryOverview**
   - 구현됐지만 미사용
   - 페이지에 추가 필요

3. **재고 초기화**
   - 페이지 로드마다 체크
   - 이미 초기화됐어도 로직 실행 (최적화 필요)
