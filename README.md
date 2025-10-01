# Simple ERP

고기 유통업을 위한 완전한 ERP 시스템

## 프로젝트 개요

**목적**: 중소 고기 유통업체를 위한 무료 로컬 ERP 시스템  
**기술 스택**: React + TypeScript + Tauri + TailwindCSS  
**개발 기간**: 2024.09 - 2025.01  
**현재 상태**: Production Ready

## 주요 기능

### 거래처 관리
- 고객/공급업체 정보 관리
- 사업자번호, 연락처, 주소
- 타입별 분류 및 검색
- CSV 가져오기/내보내기

### 상품 관리
- 카테고리별 상품 분류
- 이력번호 추적
- 거래처별 차등 가격
- 활성/비활성 상태 관리

### 거래 관리
- 매출/매입/수금 처리
- 거래 확정/취소
- 확장형 테이블로 상세 정보
- PDF 거래증 생성

### 재고 관리
- 실시간 재고 현황
- FIFO 출고 처리
- 로트 추적
- 재고 이동 이력
- 유통기한 관리

### 보고서
- Excel 종합 보고서 (15개 시트)
- 거래처별 매출 분석
- 상품별 판매 실적
- 월별 손익 현황

### 백업/복원
- 자동 백업 시스템
- JSON 파일 백업
- 데이터 복원
- Tauri 환경 지원

### 인증 시스템
- 멀티 사업자 지원
- 회사별 데이터 분리
- 세션 관리
- 로그인 상태 유지

## 시작하기

### 필수 요구사항

```bash
Node.js: v18 이상
npm: v9 이상
```

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/simple-erp.git
cd simple-erp

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### Tauri 데스크톱 앱

```bash
# 개발 모드
npm run tauri:dev

# 프로덕션 빌드
npm run tauri:build
```

## 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

**중요**: 프로젝트 루트에 `vercel.json` 파일이 있어야 합니다.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify 배포

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 빌드 후 배포
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
# gh-pages 설치
npm i -D gh-pages

# package.json에 추가
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/simple-erp"
}

# 배포
npm run deploy
```

## 프로젝트 구조

```
simple-erp/
├── public/                  # 정적 파일
│   └── stamps/             # 회사 도장 이미지
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── backup/        # 백업 시스템
│   │   ├── charts/        # 차트
│   │   ├── csv/           # CSV 처리
│   │   ├── expandable/    # 확장형 테이블
│   │   ├── inventory/     # 재고 관리
│   │   ├── invoice/       # PDF 거래증
│   │   ├── modals/        # 모달
│   │   ├── sidebar/       # 사이드바
│   │   ├── ui/            # shadcn/ui
│   │   ├── AuthWrapper.tsx
│   │   ├── Layout.tsx
│   │   └── Pagination.tsx
│   ├── hooks/             # 커스텀 훅
│   │   ├── useChartData.ts
│   │   ├── useExpandableTable.ts
│   │   └── usePagination.ts
│   ├── lib/               # 라이브러리
│   │   ├── api/          # API 모듈
│   │   ├── csv/          # CSV 처리
│   │   ├── excel/        # Excel 생성
│   │   ├── pdf/          # PDF 생성
│   │   ├── auth.ts       # 인증
│   │   ├── tauri.ts      # API 통합
│   │   ├── utils.ts      # 유틸리티
│   │   └── cn.ts         # 클래스 병합
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── Products.tsx
│   │   ├── Transactions.tsx
│   │   ├── Inventory.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── types/            # 타입 정의
│   │   └── index.ts
│   ├── App.tsx           # 메인 앱
│   ├── main.tsx          # 엔트리 포인트
│   └── index.css         # 글로벌 스타일
├── docs/                 # 문서
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── hooks/
├── .env                  # 환경 변수
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── vercel.json           # Vercel 설정
└── README.md
```

## 기술 스택

### 프론트엔드
- **React** 18.2 - UI 라이브러리
- **TypeScript** 5.2 - 타입 안전성
- **Vite** 5.0 - 빌드 도구
- **TailwindCSS** 3.3 - 스타일링
- **shadcn/ui** - UI 컴포넌트

### 상태 관리
- **React Query** 4.0 - 서버 상태 관리
- **React Router** 6.0 - 라우팅

### 데이터 처리
- **jsPDF** 2.5 - PDF 생성
- **html2canvas** 1.4 - HTML to Canvas
- **xlsx** 0.18 - Excel 처리
- **papaparse** 5.4 - CSV 처리
- **recharts** 2.8 - 차트

### 백엔드 (선택)
- **Tauri** 1.5 - 데스크톱 앱
- **Rust** - 백엔드 로직
- **SQLite** - 로컬 데이터베이스

## 환경 변수

```env
VITE_APP_NAME=고기유통 ERP
VITE_APP_VERSION=1.0.0
VITE_BACKUP_AUTO_ENABLED=true
```

## 데모 계정

```
사용자명: admin
비밀번호: 1234

사용자명: demo
비밀번호: 1234
```

## 사용 가이드

### 1. 로그인
- 데모 계정으로 로그인하거나
- 신규 회사 계정 생성

### 2. 회사 정보 설정
- 설정 → 회사 정보 탭
- 회사명, 사업자번호 등 입력
- 도장 이미지 업로드 (선택)

### 3. 거래처 등록
- 거래처 메뉴 → 거래처 추가
- 고객/공급업체 정보 입력
- CSV로 대량 등록 가능

### 4. 상품 등록
- 상품 메뉴 → 상품 추가
- 카테고리, 이력번호 입력
- 거래처별 가격 설정

### 5. 거래 입력
- 거래 메뉴 → 거래 추가
- 거래처 선택 → 상품 선택
- 수량, 단가 입력 → 저장

### 6. 재고 관리
- 재고 메뉴에서 현황 확인
- 수동 입고/출고 가능
- 로트 추적 및 이력 확인

### 7. 보고서 생성
- 보고서 메뉴
- Excel 종합 보고서 다운로드
- 15개 시트로 전체 데이터 확인

### 8. 백업
- 설정 → 백업 관리
- 자동 백업 활성화
- 수동 백업/복원 가능

## API 문서

### customerAPI
```typescript
getAll(): Promise<Customer[]>
getById(id: number): Promise<Customer>
create(data: CustomerInput): Promise<Customer>
update(id: number, data: Partial<CustomerInput>): Promise<Customer>
delete(id: number): Promise<void>
search(query: string): Promise<Customer[]>
```

### productAPI
```typescript
getAll(): Promise<Product[]>
getById(id: number): Promise<Product>
create(data: ProductInput): Promise<Product>
update(id: number, data: Partial<ProductInput>): Promise<Product>
delete(id: number): Promise<void>
getByCategory(category: string): Promise<Product[]>
```

### transactionAPI
```typescript
getAll(): Promise<TransactionWithItems[]>
getById(id: number): Promise<TransactionWithItems>
create(data: TransactionInput): Promise<TransactionWithItems>
update(id: number, data: Partial<TransactionInput>): Promise<TransactionWithItems>
delete(id: number): Promise<void>
confirm(id: number): Promise<void>
cancel(id: number): Promise<void>
getSummary(): Promise<TransactionSummary>
```

### inventoryAPI
```typescript
getInventory(): Promise<ProductInventory[]>
getByProductId(id: number): Promise<ProductInventory>
createMovement(data: MovementInput): Promise<StockMovement>
getMovementHistory(productId?: number): Promise<StockMovement[]>
createLot(data: LotInput): Promise<StockLot>
getActiveLots(productId: number): Promise<StockLot[]>
```

자세한 API 문서는 [API.md](./docs/API.md) 참조

## 타입 정의

### 주요 타입
```typescript
interface Customer {
  id: number
  type: 'customer' | 'supplier'
  name: string
  business_number: string
  representative: string
  phone: string
  email?: string
  address?: string
}

interface Product {
  id: number
  code: string
  name: string
  category: string
  unit: string
  reference_price: number
  is_active: boolean
}

interface Transaction {
  id: number
  transaction_number: string
  transaction_type: 'sales' | 'purchase' | 'payment'
  customer_id: number
  transaction_date: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
}
```

전체 타입 정의는 [src/types/index.ts](./src/types/index.ts) 참조

## 성능 최적화

### 페이지네이션
```typescript
// 50개씩 페이지 분할
const { paginatedItems } = usePagination(items, 50)
```

### React Query 캐싱
```typescript
// 자동 캐싱 및 무효화
useQuery({ queryKey: ['customers'], queryFn: customerAPI.getAll })
```

### 메모이제이션
```typescript
// 복잡한 계산 캐싱
const filtered = useMemo(() => /* ... */, [deps])
```

### 디바운싱
```typescript
// 검색 입력 디바운스
const debouncedSearch = debounce(handleSearch, 300)
```

## 트러블슈팅

### 새로고침 시 404 에러
→ `vercel.json` 파일 추가 필요 ([문서](./docs/ROUTING.md) 참조)

### localStorage 용량 초과
→ 백업 후 오래된 데이터 삭제

### 한글 깨짐 (CSV)
→ EUC-KR 인코딩 사용 ([문서](./docs/lib/README.md#csv) 참조)

### PDF 생성 실패
→ 브라우저 호환성 확인 (Chrome/Edge 권장)

## 테스트

```bash
# 단위 테스트
npm run test

# 타입 체크
npm run type-check

# 린트 검사
npm run lint
```

## 기여 가이드

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

MIT License

## 문의

프로젝트 관련 문의: [이메일 주소]

## 상세 문서

- [컴포넌트 가이드](./docs/components/README.md)
- [API 문서](./docs/lib/README.md)
- [페이지 가이드](./docs/pages/README.md)
- [훅 가이드](./docs/hooks/README.md)
- [백업 시스템](./BACKUP_GUIDE.md)
- [라우팅 설정](./docs/ROUTING.md)

## 버전 히스토리

### v1.0.0 (2025-01-15)
- 초기 릴리스
- 모든 핵심 기능 완성
- 멀티 사업자 지원
- 재고 관리 시스템
- PDF 거래증
- Excel 보고서

### v0.9.0 (2024-12-30)
- 베타 버전
- 기본 CRUD 완성
- 차트 대시보드
- CSV 처리

### v0.5.0 (2024-11-15)
- 알파 버전
- 프로토타입 완성
