# 🔐 Authentication Library

사용자 인증 및 세션 관리를 담당하는 라이브러리입니다.

## 📂 파일 구조

```
auth/
├── index.ts    # 인증 API (로그인, 회원가입, 세션 관리)
└── utils.ts    # 인증 유틸리티 (해싱, 세션 토큰 등)
```

## 🎯 주요 파일

### index.ts

사용자 인증의 핵심 기능을 제공합니다.

#### localStorage 키

```tsx
const STORAGE_KEYS = {
  USERS: 'simple-erp-users',              // 사용자 목록
  CURRENT_SESSION: 'simple-erp-current-session',  // 현재 세션
  COMPANIES: 'simple-erp-companies'       // 회사 목록
}
```

**중요**: 이전 버전의 `SESSIONS` 배열은 더 이상 사용하지 않습니다. 현재는 `CURRENT_SESSION` 단일 객체를 사용합니다.

#### 주요 함수

##### 1. 회원가입

```tsx
async function register(data: RegisterData): Promise<{
  success: boolean
  error?: string
  user?: User
  company?: Company
}>
```

**처리 과정**:
1. 입력 검증 (사용자명 3자 이상, 비밀번호 4자 이상)
2. 사용자명 중복 체크
3. 회사 생성 (자동 증가 ID, 기본 ID는 3부터)
4. 사용자 생성 (회사의 첫 사용자는 자동으로 `admin` 권한)
5. 비밀번호 해시 처리
6. 사용자 및 회사 정보 저장

**특별 계정**: `admin`(ID 1, 회사 1)과 `demo`(ID 2, 회사 2)는 시스템이 자동으로 생성하며 삭제할 수 없습니다.

**반환값**:
- `success`: 성공 여부
- `user`: 생성된 사용자 정보
- `company`: 생성된 회사 정보
- `error`: 실패 시 에러 메시지

##### 2. 로그인

```tsx
async function login(credentials: LoginCredentials): Promise<{
  success: boolean
  error?: string
  session?: UserSession
}>
```

**처리 과정**:
1. 브루트포스 방지 체크
2. 사용자 존재 여부 확인
3. 비밀번호 검증
4. 세션 토큰 생성
5. 세션 저장 (24시간 유효)
6. "로그인 상태 유지" 옵션 처리

**반환값**:
- `success`: 성공 여부
- `session`: 세션 정보 (토큰, 만료 시간 등)
- `error`: 실패 시 에러 메시지

**보안 기능**:
- 로그인 시도 제한 (5분간 5회)
- 비밀번호 해시 검증
- 세션 자동 만료

##### 3. 로그아웃

```tsx
function logout(): void
```

**처리**:
- 현재 세션 삭제
- localStorage에서 세션 제거

##### 4. 세션 조회

```tsx
function getCurrentSession(): UserSession | null
```

**특징**:
- 세션 유효성 검증
- 만료된 세션 자동 삭제
- 사용자/회사 정보 포함

##### 5. 세션 갱신

```tsx
function refreshSession(): void
```

**처리**:
- 세션 만료 시간 연장 (24시간)
- 활동 중인 사용자 유지

##### 6. 계정 삭제

```tsx
async function deleteAccount(password: string): Promise<DeleteAccountResult>
```

**처리 과정**:
1. `admin`과 `demo` 계정 보호 (삭제 불가)
2. 비밀번호 재확인
3. **탈퇴 전 자동 백업** (백업 실패 시에도 계속 진행)
4. 회사별 데이터 전체 삭제
   - `simple-erp-c{companyId}-customers`
   - `simple-erp-c{companyId}-products`
   - `simple-erp-c{companyId}-transactions`
   - `simple-erp-c{companyId}-customer-product-prices`
   - `simple-erp-c{companyId}-company`
   - `simple-erp-c{companyId}-next-ids`
5. 전역 companies 배열에서 회사 제거
6. 사용자 정보 삭제
7. 로그아웃 (세션 삭제)

**반환값**:
```tsx
{
  success: boolean
  error?: string
  deletedItems?: {
    customers: number
    products: number
    transactions: number
  }
}
```

---

### utils.ts

인증 관련 유틸리티 함수들을 제공합니다.

#### 주요 함수

##### 1. 비밀번호 해싱

```tsx
function hashPassword(password: string): string
```

**특징**:
- 간단한 해시 함수 (개발용)
- ⚠️ 실제 운영 환경에서는 bcrypt 사용 권장
- 32비트 해시 생성

##### 2. 비밀번호 검증

```tsx
function verifyPassword(password: string, hash: string): boolean
```

**처리**:
- 입력 비밀번호를 해시화
- 저장된 해시와 비교

##### 3. 세션 토큰 생성

```tsx
function generateSessionToken(): string
```

**특징**:
- 랜덤 문자열 + 타임스탬프
- Base36 인코딩
- 고유성 보장

##### 4. 세션 만료 시간 계산

```tsx
function getSessionExpiry(): string
```

**특징**:
- 현재 시간 + 24시간
- ISO 8601 형식

##### 5. 세션 유효성 확인

```tsx
function isSessionValid(expiresAt: string): boolean
```

**처리**:
- 현재 시간과 만료 시간 비교
- 만료 여부 반환

##### 6. 브루트포스 방지

```tsx
function checkLoginAttempts(username: string): boolean
function recordLoginAttempt(username: string): void
```

**특징**:
- 사용자별 시도 횟수 추적
- 5분간 5회 제한
- 시간 경과 시 자동 초기화

## 💡 사용 예시

### 1. 회원가입

```tsx
import { register } from './lib/auth'

const result = await register({
  username: 'admin',
  password: 'password123',
  confirmPassword: 'password123',
  display_name: '홍길동',
  company_name: '고기유통 주식회사',
  email: 'admin@company.com'
})

if (result.success) {
  console.log('회원가입 성공:', result.user)
  // 자동 로그인 완료
} else {
  console.error('회원가입 실패:', result.error)
}
```

### 2. 로그인

```tsx
import { login } from './lib/auth'

const result = await login({
  username: 'admin',
  password: 'password123',
  remember_me: true
})

if (result.success) {
  console.log('로그인 성공:', result.session)
} else {
  console.error('로그인 실패:', result.error)
}
```

### 3. 세션 확인 및 갱신

```tsx
import { getCurrentSession, refreshSession } from './lib/auth'

const session = getCurrentSession()

if (session) {
  console.log('로그인 상태:', session.user.display_name)
  
  // 활동 시 세션 갱신
  refreshSession()
} else {
  // 로그인 페이지로 이동
}
```

### 4. 로그아웃

```tsx
import { logout } from './lib/auth'

logout()
// 로그인 페이지로 리다이렉트
```

### 5. 계정 삭제

```tsx
import { deleteAccount } from './lib/auth'

const result = await deleteAccount('password123')

if (result.success) {
  console.log('계정 삭제 완료')
  console.log('삭제된 데이터:', result.deletedItems)
} else {
  console.error('계정 삭제 실패:', result.error)
}
```

## 🔒 보안 고려사항

### 현재 구현
- ✅ 클라이언트 사이드 인증
- ✅ 비밀번호 해싱
- ✅ 세션 자동 만료 (24시간)
- ✅ 브루트포스 방지 (5분간 5회)
- ✅ 회사별 데이터 격리

### 프로덕션 권장사항
- ⚠️ **서버 사이드 인증** 필요
- ⚠️ **bcrypt** 사용 (비밀번호 해싱)
- ⚠️ **JWT** 토큰 사용
- ⚠️ **HTTPS** 통신
- ⚠️ **CSRF** 방어
- ⚠️ **Rate Limiting** 강화
- ⚠️ **2FA** (이중 인증)

## 📊 데이터 구조

### User

```tsx
interface User {
  id: number
  username: string
  password_hash: string
  display_name: string
  company_id: number
  email?: string
  created_at: string
  role: 'admin' | 'manager' | 'staff'
}
```

### UserSession

```tsx
interface UserSession {
  token: string
  user: User
  company: Company
  expires_at: string
  created_at: string
}
```

### Company

```tsx
interface Company {
  id: number
  name: string
  created_at: string
  owner_user_id: number
}
```

## 📋 향후 개선 사항

- [ ] 서버 사이드 인증 구현
- [ ] bcrypt 해싱 적용
- [ ] JWT 토큰 도입
- [ ] 비밀번호 재설정 기능
- [ ] 이메일 인증
- [ ] 2단계 인증 (2FA)
- [ ] 역할 기반 권한 관리 (RBAC)
- [ ] 소셜 로그인
- [ ] 감사 로그 (Audit Log)
- [ ] IP 화이트리스트
