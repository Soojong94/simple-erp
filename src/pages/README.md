# Pages

메인 페이지 컴포넌트 모음

## 페이지 목록

```
pages/
├── auth/
│   ├── LoginPage.tsx        # 로그인
│   └── RegisterPage.tsx     # 회원가입
├── Dashboard.tsx            # 대시보드
├── Customers.tsx            # 거래처 관리
├── Products.tsx             # 상품 관리
├── Transactions.tsx         # 거래 관리
├── Inventory.tsx            # 재고 관리
├── Reports.tsx              # 보고서
└── Settings.tsx             # 설정
```

## 라우팅

```typescript
// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/" element={<Dashboard />} />
  <Route path="/customers" element={<Customers />} />
  <Route path="/products" element={<Products />} />
  <Route path="/transactions" element={<Transactions />} />
  <Route path="/inventory" element={<Inventory />} />
  <Route path="/reports" element={<Reports />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

## 페이지 상세

### auth/LoginPage.tsx
사용자 로그인 페이지

**기능**
- 사용자명/비밀번호 입력
- 로그인 상태 유지
- 회원가입 페이지 이동
- 데모 계정 안내

**데모 계정**
```
admin / 1234
demo / 1234
```

**사용되는 API**
```typescript
import { login } from '@/lib/auth'

const handleLogin = () => {
  const session = login(username, password)
  if (session) {
    navigate('/')
  }
}
```

### auth/RegisterPage.tsx
신규 회사 계정 생성

**입력 항목**
- 회사명 (필수)
- 담당자명 (필수)
- 이메일 (선택)
- 사용자명 (필수)
- 비밀번호 (필수)
- 비밀번호 확인 (필수)

**유효성 검사**
- 사용자명 중복 체크
- 비밀번호 일치 확인
- 필수 항목 입력 확인

**사용되는 API**
```typescript
import { createAccount } from '@/lib/auth'

const handleRegister = () => {
  const account = createAccount(
    username,
    password,
    companyData
  )
  navigate('/login')
}
```

### Dashboard.tsx
메인 대시보드

**표시 정보**
- 요약 통계 카드
  - 오늘 매출
  - 이번 달 매출
  - 총 거래처 수
  - 총 상품 수
  - 미수금 합계
  - 재고 가치
- 일별 매출 차트
- 상위 거래처 차트
- 카테고리별 매출 차트
- 최근 거래 목록

**사용되는 API**
```typescript
const { data: transactions } = useQuery({
  queryKey: ['transactions'],
  queryFn: transactionAPI.getAll
})

const { data: customers } = useQuery({
  queryKey: ['customers'],
  queryFn: customerAPI.getAll
})

const { data: inventory } = useQuery({
  queryKey: ['inventory'],
  queryFn: inventoryAPI.getInventory
})
```

**제외 목록 기능**
```typescript
// 통계에서 특정 거래처 제외
const handleToggleExclude = (customerId) => {
  if (isCustomerExcluded(customerId)) {
    removeFromExcludedCustomers(customerId)
  } else {
    addToExcludedCustomers(customerId)
  }
  refetch()
}
```

### Customers.tsx
거래처 관리 페이지

**기능**
- 거래처 목록 표시 (페이지네이션)
- 타입별 필터 (전체/고객/공급업체)
- 검색 (이름, 사업자번호, 담당자)
- 거래처 추가/수정/삭제
- CSV 가져오기/내보내기

**테이블 컬럼**
- 타입 (고객/공급업체)
- 거래처명
- 사업자번호
- 담당자
- 전화번호
- 주소
- 액션 버튼

**사용되는 컴포넌트**
```typescript
import CustomerModal from '@/components/modals/CustomerModal'
import CsvImportButton from '@/components/csv/CsvImportButton'
import CsvExportButton from '@/components/csv/CsvExportButton'
import Pagination from '@/components/Pagination'
```

**검색 필터**
```typescript
const [searchQuery, setSearchQuery] = useState('')
const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all')

const filteredCustomers = customers.filter(customer => {
  const matchesSearch = customer.name.includes(searchQuery) ||
                       customer.business_number.includes(searchQuery)
  const matchesType = typeFilter === 'all' || customer.type === typeFilter
  return matchesSearch && matchesType
})
```

### Products.tsx
상품 관리 페이지

**기능**
- 상품 목록 표시 (페이지네이션)
- 카테고리별 필터
- 활성/비활성 필터
- 검색 (상품명, 코드)
- 상품 추가/수정/삭제
- CSV 가져오기/내보내기

**테이블 컬럼**
- 카테고리 (이모지)
- 상품명
- 상품 코드
- 단위
- 참고가격
- 설명
- 상태 (활성/비활성)
- 액션 버튼

**카테고리 필터**
```typescript
const categories = [
  { value: 'all', label: '전체', emoji: '' },
  { value: '돼지고기', label: '돼지고기', emoji: '🐷' },
  { value: '소고기', label: '소고기', emoji: '🐄' },
  { value: '닭고기', label: '닭고기', emoji: '🐔' },
  { value: '오리고기', label: '오리고기', emoji: '🦆' }
]
```

**상품 통계**
```typescript
const stats = {
  total: products.length,
  active: products.filter(p => p.is_active).length,
  inactive: products.filter(p => !p.is_active).length,
  byCategory: groupBy(products, 'category')
}
```

### Transactions.tsx
거래 관리 페이지

**기능**
- 거래 목록 표시 (확장형 테이블, 페이지네이션)
- 타입별 필터 (전체/매출/매입/수금)
- 상태별 필터 (대기/확정/취소)
- 날짜 범위 필터
- 거래 추가/수정/삭제
- 거래 확정/취소
- PDF 거래증 생성

**확장형 테이블**
```typescript
// 기본 행: 거래 요약
<tr>
  <td>거래번호</td>
  <td>거래처</td>
  <td>총액</td>
  <td>상태</td>
  <td>액션</td>
</tr>

// 확장 행: 상세 정보
<tr className="expanded">
  <td colspan="5">
    <div>상품 목록, 메모, 거래증 버튼</div>
  </td>
</tr>
```

**빠른 날짜 선택**
```typescript
const quickRanges = [
  { label: '오늘', days: 0 },
  { label: '최근 7일', days: 7 },
  { label: '이번 달', days: 30 },
  { label: '최근 3개월', days: 90 }
]
```

**사이드바 연동**
```typescript
// 사이드바에서 거래처 클릭 → 해당 거래처 거래 필터링
const [selectedCustomerId, setSelectedCustomerId] = useState<number>()
```

### Inventory.tsx
재고 관리 페이지

**기능**
- 재고 목록 표시 (페이지네이션)
- 카테고리별 필터
- 재고 부족 알림
- 수동 입고/출고
- 재고 조정/폐기
- 로트 추적
- 재고 이동 이력

**테이블 컬럼**
- 상품명
- 카테고리
- 현재 재고
- 로트 수
- 가용 재고
- 예약 재고
- 최근 입고일
- 액션 버튼

**재고 통계**
```typescript
const stats = {
  totalProducts: inventory.length,
  totalStock: sum(inventory.map(i => i.quantity)),
  lowStock: inventory.filter(i => i.quantity < i.min_stock).length,
  outOfStock: inventory.filter(i => i.quantity === 0).length,
  totalValue: sum(inventory.map(i => i.quantity * i.average_cost))
}
```

**FIFO 출고**
```typescript
// 가장 오래된 로트부터 자동 출고
const handleOutput = (productId, quantity) => {
  const lots = getActiveLots(productId)
  const fifoOutput = processFIFOOutput(lots, quantity)
  
  fifoOutput.forEach(({ lotId, quantity }) => {
    createMovement({
      lot_id: lotId,
      quantity,
      type: 'out'
    })
  })
}
```

### Reports.tsx
보고서 페이지

**보고서 목록**
```typescript
const reports = [
  {
    title: '거래처별 매출 분석',
    description: '거래처별 매출 현황 및 추이'
  },
  {
    title: '상품별 판매 실적',
    description: '상품별 판매량 및 수익률'
  },
  {
    title: '월별 손익 현황',
    description: '월별 매출/매입/손익 집계'
  },
  {
    title: '미수금 현황',
    description: '거래처별 미수금 집계'
  },
  {
    title: '재고 현황',
    description: '상품별 재고 수량 및 가치'
  },
  {
    title: 'Excel 종합 보고서',
    description: '전체 데이터 Excel 다운로드'
  }
]
```

**Excel 보고서 생성**
```typescript
import { generateExcelReport } from '@/lib/excel/generateReport'

const handleExcelExport = async () => {
  await generateExcelReport()
  toast.success('보고서 생성 완료')
}
```

### Settings.tsx
설정 페이지

**탭 구성**
```typescript
const tabs = [
  { value: 'company', label: '회사 정보' },
  { value: 'backup', label: '백업 관리' },
  { value: 'system', label: '시스템 정보' }
]
```

**회사 정보 설정**
- 회사명, 대표자명
- 사업자번호
- 주소, 전화번호, 이메일
- 사업 종목
- 도장 이미지 업로드
- 기본 거래증 메모

**백업 관리**
- 자동 백업 ON/OFF
- 백업 생성/복원
- 백업 파일 목록
- 백업 폴더 설정 (Tauri)

**시스템 정보**
- 앱 버전
- 데이터 통계
- 환경 정보
- localStorage 사용량

## 공통 패턴

### React Query 사용

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['customers'],
  queryFn: customerAPI.getAll
})

const createMutation = useMutation({
  mutationFn: customerAPI.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] })
    toast.success('저장 완료')
  }
})
```

### 페이지네이션

```typescript
import { usePagination } from '@/hooks/usePagination'

const {
  paginatedItems,
  currentPage,
  totalPages,
  goToPage
} = usePagination(items, 50)
```

### 검색 필터

```typescript
const [searchQuery, setSearchQuery] = useState('')

const filtered = items.filter(item => 
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
)
```

### 로딩 상태

```typescript
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
if (!data) return null

return <Content data={data} />
```

## 성능 최적화

### 메모이제이션

```typescript
const filteredData = useMemo(() => {
  return items.filter(/* 복잡한 필터 로직 */)
}, [items, filters])
```

### 디바운스

```typescript
import { debounce } from '@/lib/utils'

const debouncedSearch = debounce((query) => {
  setSearchQuery(query)
}, 300)
```

### 가상화 (대용량 데이터)

```typescript
// 필요시 react-window 사용
import { FixedSizeList } from 'react-window'
```

## 접근성

```typescript
// 키보드 네비게이션
onKeyDown={(e) => {
  if (e.key === 'Enter') handleSubmit()
  if (e.key === 'Escape') handleCancel()
}}

// 스크린 리더
aria-label="거래처 추가"
role="dialog"
```

## 관련 문서

- [컴포넌트 가이드](../components/README.md)
- [API 문서](../lib/README.md)
- [타입 정의](../types/README.md)
