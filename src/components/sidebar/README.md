# 📌 Sidebar Components

페이지별 사이드바 컴포넌트 모음입니다. 주로 거래 페이지에서 거래처 목록 및 빠른 액션을 제공합니다.

## 📂 파일 구조

```
sidebar/
├── PageSidebar.tsx                    # 사이드바 레이아웃 및 공통 컴포넌트
└── TransactionsSidebarContent.tsx     # 거래 페이지 전용 사이드바 콘텐츠
```

## 🎯 주요 컴포넌트

### PageSidebar.tsx

페이지 우측 사이드바의 레이아웃과 재사용 가능한 UI 컴포넌트들을 제공합니다.

#### 내보내는 컴포넌트

1. **PageSidebar** (default)
   - 사이드바 메인 컨테이너
   - 고정 너비(w-80) 및 sticky 포지셔닝
   ```tsx
   <PageSidebar>
     <SidebarSection title="제목">
       {/* 콘텐츠 */}
     </SidebarSection>
   </PageSidebar>
   ```

2. **SidebarSection**
   - 사이드바 내 섹션 구분
   - 제목과 콘텐츠 그룹화

3. **QuickActionButtons**
   - 빠른 액션 버튼 그룹 컨테이너
   - 그리드 레이아웃으로 정렬

4. **QuickActionButton**
   - 개별 빠른 액션 버튼
   - 클릭 이벤트 처리

5. **SidebarCard**
   - 거래처, 상품 등을 표시하는 카드 UI
   - 아이콘, 제목, 부제목, 뱃지, 추가 정보, 액션 버튼 지원
   ```tsx
   <SidebarCard
     onClick={() => handleClick(id)}
     icon="🛒"
     title="거래처명"
     subtitle="전화번호"
     badge={{ text: "고객", className: "bg-green-100 text-green-800" }}
     extra="담당자"
     action={<button>액션</button>}
   />
   ```

6. **SidebarEmptyState**
   - 빈 상태 표시 컴포넌트
   - 아이콘과 메시지 표시

### TransactionsSidebarContent.tsx

거래(Transactions) 페이지 전용 사이드바 콘텐츠입니다.

#### 주요 기능

- **거래처 검색**: 이름, 사업자번호, 담당자로 검색
- **거래 목적 필터**: 
  - 전체 거래처
  - 매출용 (고객만)
  - 매입용 (공급업체만)
- **거래처 타입 필터**: 고객/공급업체 구분
- **거래처 목록**: 
  - 스크롤 가능한 목록 (최대 높이 600px)
  - 각 거래처별 "바로 거래 추가" 버튼
  - 거래처 클릭 시 상세 정보 표시

#### Props

```tsx
interface TransactionsSidebarContentProps {
  customers?: Customer[]                    // 거래처 목록
  searchTerm: string                        // 검색어 (부모에서 관리)
  onSearchChange: (term: string) => void    // 검색어 변경 핸들러
  onCustomerClick: (customerId: number) => void                    // 거래처 클릭
  onAddTransactionWithCustomer: (customerId: number) => void       // 거래 추가
  onFilterChange: (filters: {               // 필터 변경
    searchTerm: string
    customerFilter: 'all' | 'customer' | 'supplier'
    transactionTypeFilter: 'all' | 'sales' | 'purchase'
  }) => void
}
```

## 💡 사용 예시

### 거래 페이지에서 사용

```tsx
import PageSidebar from './components/sidebar/PageSidebar'
import TransactionsSidebarContent from './components/sidebar/TransactionsSidebarContent'

function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  
  return (
    <div className="flex">
      <main className="flex-1">
        {/* 메인 콘텐츠 */}
      </main>
      
      <PageSidebar>
        <TransactionsSidebarContent
          customers={customers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCustomerClick={handleCustomerClick}
          onAddTransactionWithCustomer={handleQuickAdd}
          onFilterChange={handleFilterChange}
        />
      </PageSidebar>
    </div>
  )
}
```

## 🎨 스타일 특징

- **고정 너비**: 320px (w-80)
- **Sticky 포지셔닝**: 스크롤 시 상단 고정
- **그레이 배경**: bg-gray-50
- **우측 테두리**: border-l border-gray-200
- **반응형 호버 효과**: 카드 hover 시 shadow 증가

## 🔄 상태 관리

- 검색어는 **부모 컴포넌트에서 관리** (Lifted State)
- 필터 상태는 사이드바 내부에서 관리
- 필터 변경 시 부모에게 알림 (onFilterChange)

## 📋 TODO

- [ ] 다른 페이지용 사이드바 콘텐츠 추가 (상품, 거래처 등)
- [ ] 사이드바 너비 조절 기능
- [ ] 사이드바 접기/펼치기 토글
- [ ] 모바일 반응형 처리 (오버레이 방식)
