# 📊 CSV Library

CSV 파일 가져오기/내보내기 및 테스트 데이터 생성 기능을 제공합니다.

## 📂 파일 구조

```
csv/
├── index.ts                # CSV 가져오기/내보내기 메인
└── testDataGenerator.ts    # 테스트 데이터 생성기
```

## 🎯 주요 파일

### index.ts

CSV 파일 처리를 위한 핵심 기능을 제공합니다.

#### 의존성

```tsx
import Papa from 'papaparse'  // CSV 파싱/생성 라이브러리
```

#### CSV 파싱/생성 옵션

```tsx
// 파싱 옵션
const CSV_PARSE_OPTIONS = {
  header: true,              // 첫 행을 헤더로 사용
  skipEmptyLines: true,      // 빈 줄 건너뛰기
  encoding: 'UTF-8',         // UTF-8 인코딩
  transformHeader: (h) => h.trim()  // 헤더 공백 제거
}

// 생성 옵션
const CSV_STRINGIFY_OPTIONS = {
  header: true,              // 헤더 포함
  encoding: 'utf-8'          // UTF-8 인코딩
}
```

#### 주요 함수

##### 1. 거래처 CSV 가져오기

```tsx
function importCustomersFromCSV(csvContent: string): Promise<Customer[]>
```

**지원 컬럼 (한국어/영어)**:
- 거래처명 / name
- 거래처구분 / type (고객/공급업체, customer/supplier)
- 사업자번호 / business_number
- 대표자 / ceo_name
- 전화번호 / phone
- 주소 / address
- 이메일 / email
- 담당자 / contact_person
- 비고 / notes

**특징**:
- 한국어/영어 컬럼명 자동 매핑
- 거래처 타입 유연한 파싱 ("고객", "customer", "C" 모두 인식)
- 사업자번호 포맷팅 (XXX-XX-XXXXX)
- 기본값 제공 (활성화 상태)

##### 2. 상품 CSV 가져오기

```tsx
function importProductsFromCSV(csvContent: string): Promise<Product[]>
```

**지원 컬럼 (한국어/영어)**:
- 상품명 / name / product_name
- 상품코드 / code / product_code
- 카테고리 / category (돼지고기/소고기/닭고기/오리고기 등)
- 단가 / unit_price / price
- 단위 / unit (kg/팩/마리 등)
- 이력번호 / traceability_code
- 원산지 / origin
- 도축장 / slaughterhouse
- 비고 / description / notes

**특징**:
- 카테고리 한국어/영어 매핑
- 단위 자동 인식
- 가격 숫자 변환
- 기본 카테고리: "기타"

##### 3. 거래 CSV 가져오기

```tsx
function importTransactionsFromCSV(csvContent: string): Promise<TransactionWithItems[]>
```

⚠️ **주의**: 거래 CSV 가져오기는 복잡하여 현재 미구현 상태입니다.

##### 4. 거래처 CSV 내보내기

```tsx
function exportCustomersToCSV(customers: Customer[]): string
```

**생성 컬럼**:
- 거래처명, 거래처구분, 사업자번호
- 대표자, 전화번호, 주소
- 이메일, 담당자, 활성화여부
- 등록일, 비고

**특징**:
- 한국어 컬럼명
- 날짜 포맷팅 (YYYY-MM-DD)
- 활성화 여부 (활성/비활성)

##### 5. 상품 CSV 내보내기

```tsx
function exportProductsToCSV(products: Product[]): string
```

**생성 컬럼**:
- 상품명, 상품코드, 카테고리
- 단가, 단위, 이력번호
- 원산지, 도축장, 활성화여부
- 등록일, 설명

**특징**:
- 한국어 컬럼명
- 가격 천 단위 구분 (예: 50,000원)
- 카테고리 한국어 표시

##### 6. 거래 CSV 내보내기

```tsx
function exportTransactionsToCSV(transactions: TransactionWithItems[]): string
```

**생성 컬럼**:
- 거래일, 거래구분, 거래처명
- 총액, 상품수량, 결제여부
- 등록일, 메모

**특징**:
- 거래 타입 한국어 (매출/매입/수금)
- 금액 천 단위 구분
- 항목별 상세 정보 (별도 파일 권장)

---

### testDataGenerator.ts

개발 및 테스트를 위한 더미 데이터 생성기입니다.

#### 랜덤 헬퍼 함수

```tsx
const randomPick = <T>(array: T[]): T => { /* ... */ }
const randomInt = (min: number, max: number): number => { /* ... */ }
const randomPrice = (min: number, max: number): number => { /* ... */ }
```

#### 샘플 데이터

##### 거래처 관련
- **50개 업체명**: 삼성식품, CJ프레시웨이, 롯데마트, 이마트, 홈플러스 등
- **10명 대표자**: 김철수, 이영희, 박민수 등
- **10개 주소**: 서울, 경기, 부산, 대구 등 전국 주요 지역

##### 상품 관련
- **돼지고기** (10종): 삼겹살, 목살, 항정살, 갈매기살 등
- **소고기** (10종): 등심, 안심, 채끝, 목심 등
- **닭고기** (10종): 닭가슴살, 닭다리, 닭날개 등
- **오리고기** (10종): 오리가슴살, 오리다리, 훈제오리 등
- **원산지** (8종): 국내산(지역별), 미국산, 호주산 등
- **도축장** (8개): 지역별 육가공센터

#### 주요 함수

##### 1. 거래처 생성

```tsx
async function generateTestCustomers(count: number): Promise<void>
```

**생성 데이터**:
- 랜덤 업체명 (중복 방지)
- 고객/공급업체 균등 분배
- 사업자번호 (XXX-XX-XXXXX 포맷)
- 랜덤 대표자, 전화번호, 주소
- 이메일, 담당자, 비고

**특징**:
- 50개 업체명 풀에서 선택
- 중복 없는 사업자번호 생성
- 일부 선택 필드는 null 가능

##### 2. 상품 생성

```tsx
async function generateTestProducts(count: number): Promise<void>
```

**생성 데이터**:
- 카테고리별 균등 분배 (돼지/소/닭/오리)
- 카테고리별 상품명 풀에서 선택
- 상품코드 (예: PORK-001, BEEF-023)
- 단가 (카테고리별 적정 가격대)
- 이력번호, 원산지, 도축장

**가격대**:
- 돼지고기: 10,000~30,000원/kg
- 소고기: 30,000~80,000원/kg
- 닭고기: 5,000~15,000원/kg
- 오리고기: 8,000~20,000원/kg

##### 3. 거래 생성

```tsx
async function generateTestTransactions(count: number): Promise<void>
```

**생성 데이터**:
- 매출/매입 균등 분배
- 최근 180일 내 랜덤 날짜
- 거래당 1~5개 상품
- 랜덤 수량 (1~100kg)
- 70% 결제 완료, 30% 미결제

**특징**:
- 실제 거래처/상품 참조
- 현실적인 거래 패턴
- 총액 자동 계산
- 재고 자동 반영 (매출: 감소, 매입: 증가)

⚠️ **주의**: 거래처와 상품이 먼저 생성되어 있어야 합니다!

## 💡 사용 예시

### 1. CSV 가져오기

```tsx
import { importCustomersFromCSV, importProductsFromCSV } from './lib/csv'

// 파일 읽기
const file = event.target.files[0]
const csvText = await file.text()

// 거래처 가져오기
const customers = await importCustomersFromCSV(csvText)
console.log(`${customers.length}개 거래처 가져오기 완료`)

// 상품 가져오기
const products = await importProductsFromCSV(csvText)
console.log(`${products.length}개 상품 가져오기 완료`)
```

### 2. CSV 내보내기

```tsx
import { exportCustomersToCSV, exportProductsToCSV } from './lib/csv'

// 거래처 내보내기
const customerCSV = exportCustomersToCSV(customers)
const blob = new Blob([customerCSV], { type: 'text/csv;charset=utf-8;' })
saveAs(blob, 'customers.csv')

// 상품 내보내기
const productCSV = exportProductsToCSV(products)
const blob2 = new Blob([productCSV], { type: 'text/csv;charset=utf-8;' })
saveAs(blob2, 'products.csv')
```

### 3. 테스트 데이터 생성

```tsx
import { 
  generateTestCustomers, 
  generateTestProducts, 
  generateTestTransactions 
} from './lib/csv/testDataGenerator'

// 순차적으로 생성
await generateTestCustomers(100)     // 거래처 100개
await generateTestProducts(150)      // 상품 150개
await generateTestTransactions(200)  // 거래 200개

console.log('테스트 데이터 생성 완료!')
```

## 🎨 CSV 포맷 예시

### 거래처 CSV

```csv
거래처명,거래처구분,사업자번호,대표자,전화번호
삼성식품,고객,123-45-67890,김철수,02-1234-5678
CJ프레시웨이,공급업체,234-56-78901,이영희,031-2345-6789
```

### 상품 CSV

```csv
상품명,상품코드,카테고리,단가,단위,원산지
삼겹살,PORK-001,돼지고기,15000,kg,국내산(전라)
등심,BEEF-001,소고기,45000,kg,호주산
```

## 📋 향후 개선 사항

- [ ] 거래 CSV 가져오기 구현
- [ ] CSV 유효성 검증 강화
- [ ] 에러 처리 개선 (어떤 행에서 오류가 났는지)
- [ ] 대용량 CSV 처리 (청크 단위)
- [ ] CSV 템플릿 다운로드 기능
- [ ] 엑셀 파일 지원 (.xlsx)
- [ ] 다국어 컬럼명 지원 확대
- [ ] CSV 미리보기 기능
- [ ] 컬럼 매핑 UI (사용자가 직접 매핑)
