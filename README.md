# Simple ERP

**중소 유통업체를 위한 완전한 ERP 시스템**

React + TypeScript + Tauri 기반의 무료 오픈소스 ERP 솔루션입니다.
브라우저와 데스크톱 앱 모두 지원하며, 멀티테넌트 아키텍처로 여러 회사가 독립적으로 데이터를 관리할 수 있습니다.

---

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [데모 계정](#데모-계정)
- [핵심 기능 설명](#핵심-기능-설명)
  - [백업/복원 시스템](#백업복원-시스템)
  - [멀티테넌트 시스템](#멀티테넌트-시스템)
  - [재고 관리](#재고-관리)
- [프로젝트 구조](#프로젝트-구조)
- [배포](#배포)
- [문의](#문의)

---

## 주요 기능

### 📊 핵심 비즈니스 기능
- **거래처 관리**: 고객/공급업체 정보 관리, CSV 가져오기/내보내기
- **상품 관리**: 카테고리별 분류, 이력번호 추적, 거래처별 차등 가격
- **거래 관리**: 매출/매입/수금 처리, 확장형 테이블, 고급 필터링
- **재고 관리**: FIFO 출고, 로트 추적, 유통기한 관리, 재고 이동 이력
- **보고서**: Excel 종합 보고서 (15개 시트), 거래처별/상품별 분석
- **PDF 거래증**: 거래증 자동 생성 및 미리보기

### 🔐 시스템 관리
- **멀티테넌트**: 회사별 완전한 데이터 분리 (localStorage 기반)
- **인증 시스템**: 로그인, 회원가입, 세션 관리, 브루트포스 방지
- **백업/복원**: JSON 백업, 자동 백업, 회사 간 데이터 이동
- **회사 정보**: 회사명, 사업자번호, 도장 이미지 관리

### 📈 대시보드 & 분석
- **실시간 KPI**: 거래처, 상품, 거래, 재고 통계
- **차트**: 월별 매출 추이, 고객별 매출 비중
- **재고 현황**: 안전재고 미달, 유통기한 임박 알림

---

## 기술 스택

### Frontend
- **React 18.2** - UI 라이브러리
- **TypeScript 5.3** - 타입 안전성
- **Vite 7.1** - 빌드 도구
- **TailwindCSS 3.3** - 유틸리티 우선 CSS

### State Management
- **React Query 4.36** - 서버 상태 관리 및 캐싱
- **React Router 6.20** - 클라이언트 사이드 라우팅

### Data Processing
- **jsPDF 2.5** - PDF 생성
- **html2canvas 1.4** - HTML to Canvas 변환
- **xlsx 0.18** - Excel 파일 처리
- **papaparse 5.4** - CSV 파싱
- **recharts 2.8** - 차트 라이브러리

### Desktop App (Optional)
- **Tauri 1.5** - 경량 데스크톱 앱 프레임워크
- **Rust** - 백엔드 로직
- **SQLite** - 로컬 데이터베이스 (향후 지원 예정)

---

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

### Tauri 데스크톱 앱 (선택사항)

```bash
# 개발 모드
npm run tauri:dev

# 프로덕션 빌드
npm run tauri:build
```

---

## 데모 계정

시스템에는 두 개의 데모 계정이 기본 제공됩니다:

```
사용자명: admin
비밀번호: 1234
회사: 고기유통 주식회사

사용자명: demo
비밀번호: 1234
회사: 농협 축산물
```

**특징:**
- `admin`과 `demo` 계정은 삭제할 수 없습니다 (시스템 보호)
- 각 계정은 독립된 회사 데이터를 가지며, 서로 데이터가 보이지 않습니다
- 새로운 계정은 회원가입을 통해 생성 가능 (자동으로 새 회사 생성)

---

## 핵심 기능 설명

### 백업/복원 시스템

Simple ERP의 백업 시스템은 **회사 중립적 설계**로 유연한 데이터 관리를 지원합니다.

#### 백업 데이터 구조

```json
{
  "companyInfo": {
    "companyId": 1,
    "companyName": "고기유통 주식회사",
    "backupDate": "2025-10-03T12:00:00Z"
  },
  "customers": [...],
  "products": [...],
  "transactions": [...],
  "customerProductPrices": [...],
  "nextIds": {...},
  "metadata": {
    "backupDate": "2025-10-03T12:00:00Z",
    "version": "1.0.0",
    "totalRecords": 150,
    "appVersion": "Simple ERP v1.0",
    "sourceCompanyId": 1
  }
}
```

#### 백업 대상 데이터

- ✅ **거래처 (customers)** - 고객 및 공급업체 정보
- ✅ **상품 (products)** - 상품 목록 및 카테고리
- ✅ **거래 (transactions)** - 매출/매입/수금 내역 (항목 포함)
- ✅ **거래처별 가격 (customerProductPrices)** - 차등 가격 정보
- ✅ **ID 시퀀스 (nextIds)** - 자동 증가 카운터
- ❌ **회사 정보 (company)** - 복원 시 현재 회사 정보 유지

#### 주요 기능

**1. 수동 백업**
```
설정 → 백업 관리 → "백업 생성" 버튼 클릭
→ simple-erp-backup-YYYY-MM-DD.json 파일 다운로드
```

**2. 자동 백업**
- 하루 1회 자동 백업 (첫 로그인 시)
- 설정에서 활성화/비활성화 가능
- Tauri 환경: 지정된 폴더에 자동 저장
- 브라우저 환경: 자동 다운로드

**3. 백업 복원**
```
설정 → 백업 관리 → "백업 복원" 버튼
→ JSON 파일 선택
→ 현재 로그인한 회사의 데이터로 복원
```

**4. 계정 탈퇴 시 자동 백업**
- 회원 탈퇴 전 자동으로 백업 파일 생성
- 백업 후 모든 회사 데이터 삭제
- 나중에 새 계정으로 복원 가능

#### 회사 간 데이터 이동

백업 시스템은 **회사 간 데이터 이동**을 지원합니다:

**시나리오 1: 같은 회사에서 백업/복원**
```
1. 회사 A로 로그인
2. 백업 생성 (거래처 50개, 상품 30개)
3. 실수로 데이터 삭제
4. 백업 파일 복원 → 회사 A에 데이터 복구 ✅
```

**시나리오 2: 다른 회사로 데이터 이동**
```
1. 회사 A로 로그인
2. 백업 생성 (거래처 50개, 상품 30개)
3. 회사 B로 로그인
4. 백업 파일 복원 → 회사 B에 데이터 복사 ✅
```

**시나리오 3: 신규 회사 생성 후 데이터 복원**
```
1. 기존 회사에서 백업 생성
2. 회원가입으로 새 회사 C 생성
3. 회사 C로 로그인
4. 기존 백업 파일 복원 → 회사 C에 데이터 생성 ✅
```

#### 백업 환경별 차이

| 환경 | 백업 방식 | 복원 방식 | 파일 관리 |
|------|----------|----------|----------|
| **브라우저** | 다운로드 폴더에 저장 | 파일 선택하여 업로드 | 수동 관리 |
| **Tauri 앱** | 지정 폴더에 자동 저장 | 폴더에서 파일 목록 조회 | 폴더 열기, 파일 삭제 지원 |

#### 백업 파일 검증

복원 시 자동으로 다음 항목을 검증합니다:

- ✅ JSON 형식 유효성
- ✅ 필수 필드 존재 여부 (`companyInfo`, `customers`, `products`, etc.)
- ✅ 데이터 타입 일치 (배열, 객체 구조)
- ✅ 메타데이터 무결성

검증 실패 시 복원을 중단하고 오류 메시지를 표시합니다.

---

### 멀티테넌트 시스템

Simple ERP는 **회사별 완전한 데이터 분리**를 보장합니다.

#### localStorage 기반 데이터 분리

각 회사의 데이터는 고유한 `company_id`로 구분됩니다:

```javascript
// 회사 1의 데이터
localStorage['simple-erp-c1-customers']    // 거래처
localStorage['simple-erp-c1-products']     // 상품
localStorage['simple-erp-c1-transactions'] // 거래

// 회사 2의 데이터
localStorage['simple-erp-c2-customers']
localStorage['simple-erp-c2-products']
localStorage['simple-erp-c2-transactions']
```

#### 전역 설정 (회사 구분 없음)

다음 설정은 모든 회사가 공유합니다:

```javascript
localStorage['simple-erp-users']              // 사용자 계정
localStorage['simple-erp-companies']          // 회사 목록
localStorage['simple-erp-current-session']    // 현재 세션
localStorage['simple-erp-backup-settings']    // 백업 설정
localStorage['simple-erp-auto-backup-enabled'] // 자동 백업 활성화
localStorage['simple-erp-last-backup-date']   // 마지막 백업 날짜
```

#### 회사 생성 및 사용자 관리

**회원가입 시:**
1. 새로운 회사 생성 (`company_id` 자동 증가)
2. 해당 회사의 관리자(admin) 계정 생성
3. 회사별 localStorage 키 자동 생성

**로그인 시:**
1. 세션에 `company_id` 저장
2. 모든 API 호출 시 `company_id` 기반 키 사용
3. React Query 캐시도 `company_id`로 분리

**로그아웃 시:**
1. 세션 삭제
2. 페이지 새로고침으로 캐시 초기화

#### 보안 및 격리

- ✅ 회사 간 데이터 접근 불가
- ✅ `admin`과 `demo` 계정 삭제 방지
- ✅ 각 회사의 첫 사용자는 자동으로 `admin` 권한 부여
- ✅ ID 시퀀스 회사별 독립 관리

---

### 재고 관리

**FIFO(선입선출) 기반 재고 관리 시스템**

#### 주요 기능

**1. 로트 관리**
- 입고 시 자동으로 로트 생성
- 로트 번호: `LOT-YYYY-MM-DD-XXXX` 형식
- 유통기한, 원산지, 도축장 정보 포함

**2. FIFO 출고**
- 가장 오래된 로트부터 자동 출고
- 로트 단위 재고 추적
- 출고 이력 기록

**3. 유통기한 관리**
- 유통기한 임박 알림 (7일 이내)
- 유통기한 경과 로트 자동 만료 처리
- 대시보드에 알림 카드 표시

**4. 재고 이동 이력**
- 모든 입고/출고 기록 저장
- 거래 연동 여부 추적
- 재고 조정 기능

#### 재고 계산 방식

```typescript
// 현재 재고 = 입고 합계 - 출고 합계
current_stock = Σ(매입 수량) - Σ(매출 수량) + Σ(재고 조정)

// 가용 재고 = 현재 재고 - 안전 재고
available_stock = current_stock - safety_stock
```

---

## 프로젝트 구조

```
simple-erp/
├── public/                  # 정적 파일
│   └── stamps/             # 회사 도장 이미지
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── backup/        # 백업 시스템 UI
│   │   ├── charts/        # 차트 컴포넌트
│   │   ├── company/       # 회사 정보 관리
│   │   ├── csv/           # CSV 가져오기/내보내기
│   │   ├── excel/         # Excel 보고서 생성
│   │   ├── expandable/    # 확장형 테이블
│   │   ├── inventory/     # 재고 관리
│   │   ├── invoice/       # PDF 거래증
│   │   ├── modals/        # 모달 컴포넌트
│   │   ├── sidebar/       # 사이드바
│   │   └── ...
│   ├── hooks/             # 커스텀 훅
│   │   ├── useChartData.ts
│   │   ├── useExpandableTable.ts
│   │   ├── usePagination.ts
│   │   └── ...
│   ├── lib/               # 라이브러리 및 유틸리티
│   │   ├── api/          # API 모듈 (localStorage 기반)
│   │   ├── auth/         # 인증 시스템
│   │   ├── csv/          # CSV 처리
│   │   ├── excel/        # Excel 생성
│   │   ├── pdf/          # PDF 생성
│   │   ├── backup.ts     # 백업/복원 로직
│   │   ├── tauri.ts      # API 통합 레이어
│   │   └── utils.ts      # 유틸리티 함수
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── auth/         # 로그인/회원가입
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── Products.tsx
│   │   ├── Transactions.tsx
│   │   ├── Inventory.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── types/            # TypeScript 타입 정의
│   │   └── index.ts
│   ├── App.tsx           # 메인 앱
│   ├── main.tsx          # 엔트리 포인트
│   └── index.css         # 글로벌 스타일
├── src-tauri/            # Tauri 백엔드 (Rust)
├── docs/                 # 문서
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

**중요**: 프로젝트 루트에 `vercel.json` 파일 필요:

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

---

## 사용 가이드

### 1. 로그인
- 데모 계정(`admin` 또는 `demo`)으로 로그인
- 신규 회사 계정 생성

### 2. 회사 정보 설정
- **설정 → 회사 정보** 탭
- 회사명, 사업자번호 입력
- 도장 이미지 업로드 (선택)

### 3. 거래처 등록
- **거래처 관리** 메뉴 → 거래처 추가
- 고객/공급업체 정보 입력
- CSV로 대량 등록 가능

### 4. 상품 등록
- **상품 관리** 메뉴 → 상품 추가
- 카테고리, 이력번호 입력
- 거래처별 차등 가격 설정

### 5. 거래 입력
- **거래 관리** 메뉴 → 거래 추가
- 거래처 선택 → 상품 선택
- 수량, 단가 입력 → 저장
- 재고 관리 상품은 자동으로 재고 반영

### 6. 재고 확인
- **재고 관리** 메뉴에서 현황 확인
- 로트별 재고 조회
- 수동 입고/출고 가능

### 7. 보고서 생성
- **보고서** 메뉴
- Excel 종합 보고서 다운로드
- 15개 시트로 전체 데이터 확인

### 8. 백업
- **설정 → 백업 관리**
- 자동 백업 활성화
- 수동 백업/복원 가능

---

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
```

### transactionAPI

```typescript
getAll(): Promise<TransactionWithItems[]>
getById(id: number): Promise<TransactionWithItems>
create(data: TransactionInput): Promise<TransactionWithItems>
update(id: number, data: Partial<TransactionInput>): Promise<TransactionWithItems>
delete(id: number): Promise<void>
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

전체 API 문서는 [docs/lib/README.md](./docs/lib/README.md) 참조

---

## 주요 타입 정의

```typescript
interface Customer {
  id: number
  name: string
  business_number?: string
  type: 'customer' | 'supplier'
  phone?: string
  email?: string
  address?: string
  outstanding_balance: number  // 미수금
  is_active: boolean
}

interface Product {
  id: number
  name: string
  code?: string
  category?: string
  unit: string
  traceability_number?: string  // 이력번호
  use_inventory_management: boolean
  is_active: boolean
}

interface Transaction {
  id: number
  customer_id: number
  transaction_type: 'sales' | 'purchase' | 'payment'
  transaction_date: string
  total_amount: number
  tax_amount: number
  items: TransactionItem[]
}

interface ProductInventory {
  product_id: number
  current_stock: number
  safety_stock: number
  last_updated: string
}
```

전체 타입 정의는 [src/types/index.ts](./src/types/index.ts) 참조

---

## 성능 최적화

### 페이지네이션
```typescript
// 50개씩 페이지 분할
const { paginatedItems } = usePagination(items, 50)
```

### React Query 캐싱
```typescript
// 자동 캐싱 및 무효화 (회사별 분리)
useQuery({
  queryKey: ['customers', session?.company_id],
  queryFn: customerAPI.getAll
})
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

---

## 트러블슈팅

### 새로고침 시 404 에러
→ `vercel.json` 또는 Netlify `_redirects` 파일 추가 필요

### localStorage 용량 초과
→ 백업 후 오래된 데이터 삭제 또는 전체 초기화

### 한글 깨짐 (CSV)
→ EUC-KR 인코딩 사용 (자동 처리됨)

### PDF 생성 실패
→ 브라우저 호환성 확인 (Chrome/Edge 권장)

### 백업 파일 복원 실패
→ JSON 형식 유효성 확인, 필수 필드 누락 여부 체크

---

## 기여 가이드

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 라이선스

MIT License

---

## 버전 히스토리

### v1.0.0 (2025-01-15)
- ✅ 초기 릴리스
- ✅ 모든 핵심 기능 완성
- ✅ 멀티테넌트 시스템
- ✅ 백업/복원 시스템
- ✅ 재고 관리 (FIFO, 로트 추적)
- ✅ PDF 거래증 생성
- ✅ Excel 보고서 (15개 시트)
- ✅ 대시보드 및 차트

---

## 문의

프로젝트 관련 문의: [이메일 주소]

GitHub Issues: [https://github.com/yourusername/simple-erp/issues](https://github.com/yourusername/simple-erp/issues)

---

## 상세 문서

- [컴포넌트 가이드](./docs/components/README.md)
- [API 문서](./docs/lib/README.md)
- [페이지 가이드](./docs/pages/README.md)
- [훅 가이드](./docs/hooks/README.md)
- [백업 시스템 설계](./BACKUP_SYSTEM_REDESIGN.md)
- [라우팅 설정](./docs/ROUTING.md)

---

**Simple ERP** - 중소 유통업체를 위한 완전하고 무료인 ERP 솔루션
