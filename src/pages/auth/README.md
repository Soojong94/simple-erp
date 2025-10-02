# 🔐 Authentication Pages

사용자 인증 관련 페이지 컴포넌트입니다.

## 📂 파일 구조

```
auth/
├── LoginPage.tsx       # 로그인 페이지
└── RegisterPage.tsx    # 회원가입 페이지
```

## 🎯 주요 컴포넌트

### LoginPage.tsx

사용자 로그인 페이지입니다.

#### Props

```tsx
interface LoginPageProps {
  onLoginSuccess: () => void    // 로그인 성공 콜백
  onShowRegister?: () => void   // 회원가입 페이지로 이동 (선택)
}
```

#### 주요 기능

1. **로그인 폼**
   - 사용자명 입력
   - 비밀번호 입력
   - "로그인 상태 유지" 체크박스 (remember_me)

2. **유효성 검사**
   - 필수 입력 필드 검증
   - 로그인 실패 시 에러 메시지 표시

3. **보안 기능**
   - 연속 로그인 실패 시도 제한 (lib/auth의 기능 활용)
   - 비밀번호 해시 검증

4. **UI 상태**
   - 로딩 중 버튼 비활성화
   - 로딩 스피너 표시
   - 에러 메시지 표시

#### 폼 데이터 구조

```tsx
interface LoginCredentials {
  username: string
  password: string
  remember_me: boolean
}
```

---

### RegisterPage.tsx

새 회사 계정 생성 페이지입니다.

#### Props

```tsx
interface RegisterPageProps {
  onRegisterSuccess: () => void    // 회원가입 성공 콜백
  onBack: () => void               // 뒤로가기 콜백
}
```

#### 주요 기능

1. **회원가입 폼**
   - **필수 정보**:
     - 회사명
     - 담당자명
     - 사용자명
     - 비밀번호
     - 비밀번호 확인
   - **선택 정보**:
     - 이메일

2. **유효성 검사**
   - 비밀번호 일치 확인
   - 필수 필드 검증
   - 사용자명 형식 검증 (영문, 숫자, 밑줄만)

3. **회사별 독립 데이터**
   - 각 회사는 독립된 데이터 공간 보유
   - 생성 계정은 관리자 권한 자동 부여

4. **UI 안내**
   - 입력 필드별 placeholder 예시
   - 안내사항 섹션 (파란색 박스)
   - 로딩 상태 표시

#### 폼 데이터 구조

```tsx
interface RegisterData {
  username: string          // 로그인 ID
  password: string          // 비밀번호
  confirmPassword: string   // 비밀번호 확인
  display_name: string      // 담당자명
  company_name: string      // 회사명
  email?: string            // 이메일 (선택)
}
```

## 💡 사용 예시

### App.tsx에서 인증 흐름 관리

```tsx
import { useState } from 'react'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import { getCurrentSession } from './lib/auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getCurrentSession())
  const [showRegister, setShowRegister] = useState(false)
  
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage
          onRegisterSuccess={() => {
            setIsAuthenticated(true)
            setShowRegister(false)
          }}
          onBack={() => setShowRegister(false)}
        />
      )
    }
    
    return (
      <LoginPage
        onLoginSuccess={() => setIsAuthenticated(true)}
        onShowRegister={() => setShowRegister(true)}
      />
    )
  }
  
  return <MainApp />
}
```

## 🎨 UI 특징

### 공통 스타일
- **중앙 정렬 레이아웃**: min-h-screen flex items-center justify-center
- **최대 너비**: max-w-md (중간 크기 폼)
- **회색 배경**: bg-gray-50
- **카드 스타일**: 흰색 배경, 그림자

### 로고
- 고기 이모지 🥩 사용
- 파란색 원형 배경 (bg-blue-100)

### 에러 표시
- 빨간색 배경 (bg-red-50)
- 둥근 모서리 (rounded-md)

### 버튼
- 주 버튼: 파란색 (bg-blue-600)
- 보조 버튼: 흰색 테두리 (border-gray-300)
- 비활성화: opacity-50

## 🔒 보안 고려사항

1. **비밀번호 처리**
   - 브라우저 자동완성 지원
   - type="password"로 마스킹
   - 클라이언트 측 해시 처리 (lib/auth)

2. **세션 관리**
   - "로그인 상태 유지" 옵션
   - localStorage 기반 세션 저장
   - 세션 만료 검증

3. **데이터 보호**
   - 회사별 데이터 격리
   - 로컬 저장소 활용

## 🔧 의존성

- `login()` - lib/auth의 로그인 함수
- `register()` - lib/auth의 회원가입 함수
- `getCurrentSession()` - lib/auth의 세션 조회 함수
- `LoginCredentials`, `RegisterData` - types의 인증 타입

## 📋 향후 개선 사항

- [ ] 소셜 로그인 (Google, Kakao 등)
- [ ] 2단계 인증 (2FA)
- [ ] 비밀번호 찾기/재설정
- [ ] 이메일 인증
- [ ] 비밀번호 강도 표시기
- [ ] 아이디 중복 확인 실시간 검증
- [ ] 다국어 지원
- [ ] 다크모드 지원
