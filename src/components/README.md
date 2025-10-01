# Components

재사용 가능한 React 컴포넌트 모음

## 폴더 구조

```
components/
├── backup/              # 백업 시스템
├── charts/              # 차트 시각화
├── company/             # 회사 정보
├── csv/                 # CSV 처리
├── expandable/          # 확장형 테이블
├── inventory/           # 재고 관리
├── invoice/             # PDF 거래증
├── modals/              # 모달 대화상자
├── sidebar/             # 사이드바
├── system/              # 시스템 정보
├── ui/                  # shadcn/ui 기본 컴포넌트
├── AuthWrapper.tsx      # 인증 래퍼
├── Layout.tsx           # 메인 레이아웃
└── Pagination.tsx       # 페이지네이션
```

## 주요 컴포넌트

### Layout.tsx
전체 앱의 메인 레이아웃

**구성 요소**
- 좌측 고정 사이드바 (네비게이션)
- 상단 헤더 (사용자 정보, 로그아웃)
- 메인 컨텐츠 영역
- 반응형 디자인

**사용법**
```typescript
import Layout from '@/components/Layout'

function App() {
  return (
    <Layout>
      <YourPage />
    </Layout>
  )
}
```

### AuthWrapper.tsx
인증 상태 관리 및 보호

**기능**
- 로그인 상태 확인
- 세션 유지
- 회사별 데이터 초기화
- React Query 캐시 관리

**제공하는 Context**
```typescript
interface SessionContext {
  session: UserSession | null
  logout: () => void
}
```

### Pagination.tsx
페이지네이션 UI 컴포넌트

**Props**
```typescript
interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  pageRange: number[]
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
}
```

**기능**
- 첫/마지막 페이지 이동
- 이전/다음 페이지
- 페이지 번호 직접 클릭
- 현재 범위 표시 (예: 1-50 / 총 125개)
- 모바일 대응

## 모듈별 상세 가이드

### backup/
데이터 백업 및 복원 시스템

**컴포넌트 목록**
- `BackupMessage.tsx` - 백업 상태 메시지
- `BackupStats.tsx` - 데이터 통계 카드
- `BackupFolderSettings.tsx` - 백업 폴더 설정
- `BackupActions.tsx` - 백업/복원 버튼
- `BackupFileList.tsx` - 백업 파일 목록
- `BackupSection.tsx` - 통합 백업 섹션

**사용 예시**
```typescript
import { BackupSection } from '@/components/backup'

<BackupSection 
  onBackupComplete={() => console.log('완료')}
/>
```

### charts/
Recharts 기반 차트 컴포넌트

**컴포넌트 목록**
- `DailySalesChart.tsx` - 일별 매출 차트
- `TopCustomersChart.tsx` - 상위 거래처 차트
- `CategoryChart.tsx` - 카테고리별 매출 차트

**특징**
- 반응형 디자인
- 한글 폰트 지원
- 툴팁 포맷팅
- 색상 테마 통일

### csv/
CSV 파일 가져오기/내보내기

**컴포넌트 목록**
- `CsvImportButton.tsx` - CSV 가져오기 버튼
- `CsvExportButton.tsx` - CSV 내보내기 버튼
- `CsvPreviewModal.tsx` - 미리보기 모달

**지원 기능**
- 한글 인코딩 (EUC-KR, UTF-8)
- 필드 매핑
- 유효성 검사
- 중복 데이터 체크

### expandable/
확장 가능한 테이블 시스템

**컴포넌트 목록**
- `ExpandableTable.tsx` - 메인 테이블
- `TransactionExpandableRow.tsx` - 거래 확장 행
- `ExpandableRowHeader.tsx` - 확장 헤더
- `ExpandableRowContent.tsx` - 확장 내용

**기능**
- 행 확장/축소 애니메이션
- 상세 정보 표시
- 액션 버튼 통합
- 키보드 네비게이션

### inventory/
재고 관리 컴포넌트

**컴포넌트 목록**
- `StockMovementModal.tsx` - 재고 이동 모달
- `LotInfoCard.tsx` - 로트 정보 카드
- `InventoryStats.tsx` - 재고 통계

**주요 기능**
- 재고 입고/출고
- FIFO 출고 처리
- 로트 추적
- 유통기한 관리

### invoice/
PDF 거래증 생성

**컴포넌트**
- `InvoicePreviewModal.tsx` - PDF 미리보기 모달

**기능**
- A4 2단 분할 레이아웃
- 회사 도장 자동 삽입
- 이력번호 표시
- PDF 다운로드/인쇄

### modals/
CRUD 모달 대화상자

**컴포넌트 목록**
- `CustomerModal.tsx` - 거래처 추가/수정
- `ProductModal.tsx` - 상품 추가/수정
- `TransactionModal.tsx` - 거래 추가/수정

**모듈화된 거래 모달**
- `TransactionBasicInfo.tsx` - 기본 정보
- `TransactionItemsList.tsx` - 상품 목록
- `TransactionSummary.tsx` - 거래 요약
- `ProductDropdown.tsx` - 커스텀 드롭다운

### sidebar/
사이드바 시스템

**컴포넌트**
- `PageSidebar.tsx` - 메인 사이드바
- `TransactionsSidebarContent.tsx` - 거래 사이드바 내용

**기능**
- 빠른 접근 링크
- 최근 거래 표시
- 거래처 카드
- 액션 버튼

### ui/
shadcn/ui 기본 컴포넌트

**포함된 컴포넌트**
- Button, Input, Label
- Card, Dialog, Select
- Table, Tabs, Toast
- DropdownMenu, Switch
- 기타 20+ 컴포넌트

## 컴포넌트 작성 가이드

### 디자인 원칙

**단일 책임**
```typescript
// ❌ 나쁜 예
function MegaComponent() {
  // 데이터 fetch, 상태 관리, UI 렌더링 모두 포함
}

// ✅ 좋은 예
function DataContainer() {
  const data = useFetchData()
  return <PresentationalComponent data={data} />
}
```

**Props 타입 정의**
```typescript
interface ComponentProps {
  // required props
  id: number
  name: string
  
  // optional props
  className?: string
  onSave?: () => void
  
  // children
  children?: React.ReactNode
}
```

**메모이제이션**
```typescript
export const ExpensiveComponent = React.memo(({ data }) => {
  // 복잡한 렌더링 로직
})
```

### 네이밍 컨벤션

**파일명**
- PascalCase: `CustomerModal.tsx`
- 의미 있는 이름: `TransactionExpandableRow.tsx`

**컴포넌트명**
- PascalCase: `BackupSection`
- 명확한 역할: `CsvImportButton`

**Props 인터페이스**
- `ComponentNameProps`: `CustomerModalProps`

### 폴더 구조 규칙

```
feature-name/
├── FeatureMain.tsx          # 메인 컴포넌트
├── FeatureItem.tsx          # 하위 컴포넌트
├── FeatureList.tsx          # 목록 컴포넌트
├── types.ts                 # 타입 정의 (필요시)
└── index.ts                 # export 통합
```

## 의존성

### 필수 라이브러리
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@tanstack/react-query": "^4.0.0",
  "tailwindcss": "^3.3.0"
}
```

### UI 컴포넌트
```json
{
  "@radix-ui/react-*": "여러 패키지",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0"
}
```

## 관련 문서

- [백업 시스템 가이드](../lib/README.md#backup)
- [API 사용법](../lib/README.md#api)
- [타입 정의](../types/README.md)
- [페이지 컴포넌트](../pages/README.md)
