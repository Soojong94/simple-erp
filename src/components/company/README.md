# Company Components

회사 정보 관리를 위한 컴포넌트

## 📋 파일 목록

### CompanyInfoSection.tsx

**역할**: 회사 기본 정보 및 도장 이미지 관리 컴포넌트

**주요 기능**
1. **회사 정보 관리**
   - 회사명, 사업자등록번호 (필수)
   - 사업장 주소
   - 대표자명
   - 전화번호, 이메일
   - 업종
   - 거래명세서 기본 메모

2. **도장 이미지 관리**
   - 이미지 업로드 (PNG/JPG, 최대 1MB)
   - 원형 미리보기 표시
   - localStorage에 회사별로 저장
   - 이미지 제거 기능
   - 거래명세서 자동 표시

3. **편집 모드**
   - 수정 버튼으로 편집 모드 전환
   - 저장 또는 취소
   - React Query로 데이터 동기화

**Props**
```typescript
interface CompanyInfoSectionProps {
  company: Company | undefined        // 회사 정보 객체
  isLoading: boolean                  // 로딩 상태
  onMessage: (                        // 메시지 콜백
    message: string, 
    type: 'success' | 'error' | 'info'
  ) => void
}
```

**Company 타입**
```typescript
interface Company {
  id: number
  name: string                        // 회사명
  business_number: string             // 사업자등록번호
  ceo_name?: string                   // 대표자명
  address?: string                    // 사업장 주소
  phone?: string                      // 전화번호
  email?: string                      // 이메일
  business_type?: string              // 업종
  tax_invoice_api_key?: string        // 전자세금계산서 API 키
  tax_invoice_cert_file?: string      // 인증서 파일
  default_invoice_memo?: string       // 거래명세서 기본 메모
}
```

---

## 🔍 상세 기능 설명

### 1. 회사 정보 폼

**필수 필드**
- 회사명 (`name`)
- 사업자등록번호 (`business_number`)

**선택 필드**
- 사업장 주소 (`address`) - 2열 전체 폭
- 대표자명 (`ceo_name`)
- 전화번호 (`phone`) - tel 타입
- 이메일 (`email`) - email 타입
- 업종 (`business_type`)
- 거래명세서 기본 메모 (`default_invoice_memo`) - textarea, 3줄

**폼 동작**
```typescript
// 편집 모드 아닐 때
- 모든 필드 disabled
- 배경색 gray-50
- 수정 버튼 표시

// 편집 모드일 때
- 모든 필드 활성화
- 저장/취소 버튼 표시
- 폼 제출 시 updateCompanyMutation 실행
```

---

### 2. 도장 이미지 관리

**저장 방식**
```typescript
// 회사별 localStorage 키
const getStampStorageKey = () => {
  const session = getCurrentSession()
  if (!session) return 'simple-erp-stamp-image'
  return `simple-erp-c${session.company_id}-stamp-image`
}
```

**업로드 프로세스**
1. 파일 선택 (`<input type="file">`)
2. 파일 유효성 검사
   - 크기: 1MB 이하
   - 형식: image/* 타입만
3. FileReader로 base64 변환
4. localStorage 저장
5. 미리보기 업데이트
6. 성공 메시지 표시

**미리보기 UI**
```typescript
// 이미지 있을 때
<img 
  src={stampPreview} 
  alt="도장 미리보기" 
  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
/>

// 이미지 없을 때
<div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
  <span className="text-3xl">📷</span>
</div>
```

**제거 기능**
- 이미지 우측 상단 X 버튼
- 또는 하단 "제거" 버튼
- localStorage에서 삭제
- state 초기화

---

### 3. React Query 통합

**Mutation**
```typescript
const updateCompanyMutation = useMutation({
  mutationFn: (data: typeof formData) => {
    if (company?.id) {
      return companyAPI.update(company.id, data)  // 업데이트
    } else {
      return companyAPI.create(data)               // 신규 생성
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['company'] })
    setIsEditing(false)
    onMessage('회사 정보가 저장되었습니다.', 'success')
  },
  onError: (error) => {
    console.error('Company update error:', error)
    onMessage('저장 중 오류가 발생했습니다.', 'error')
  }
})
```

**쿼리 무효화**
- 저장 성공 시 `['company']` 쿼리 무효화
- 자동으로 최신 데이터 리페치

---

## 💡 사용 예시

### Settings 페이지에서 사용
```typescript
import { useQuery } from '@tanstack/react-query'
import { companyAPI } from '@/lib/tauri'
import CompanyInfoSection from '@/components/company/CompanyInfoSection'

function Settings() {
  const [message, setMessage] = useState<{
    text: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: companyAPI.getAll
  })

  const handleMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div>
      <CompanyInfoSection
        company={company}
        isLoading={isLoading}
        onMessage={handleMessage}
      />
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
```

---

## 🎨 UI/UX 특징

### 1. 편집 모드 전환
```typescript
// 읽기 모드
- 우측 상단 "수정" 버튼
- 모든 필드 비활성화 (회색 배경)

// 편집 모드
- 모든 필드 활성화 (흰색 배경)
- 하단 "저장" / "취소" 버튼
- 취소 시 이전 값으로 복원
```

### 2. 로딩 상태
```typescript
{isLoading ? (
  <div className="text-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
    <div className="mt-2 text-sm text-gray-500">회사 정보 로딩 중...</div>
  </div>
) : (
  // 폼 표시
)}
```

### 3. 반응형 그리드
```typescript
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
  {/* 대부분 필드: 1열 */}
  <div>...</div>
  
  {/* 주소, 메모: 2열 전체 */}
  <div className="sm:col-span-2">...</div>
</div>
```

---

## 🔧 의존성

### 외부 라이브러리
```typescript
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
```

### 내부 모듈
```typescript
import { companyAPI } from '../../lib/tauri'
import { Company } from '../../types'
import { getCurrentSession } from '../../lib/auth'
```

---

## 📝 주요 상태 관리

### State 목록
```typescript
const [isEditing, setIsEditing] = useState(false)          // 편집 모드
const [stampImage, setStampImage] = useState<string>('')   // 도장 이미지 (base64)
const [stampPreview, setStampPreview] = useState<string>('')  // 미리보기
const [formData, setFormData] = useState({...})            // 폼 데이터
```

### Effect Hooks
```typescript
// 1. 도장 이미지 불러오기 (컴포넌트 마운트 시)
useEffect(() => {
  const stampKey = getStampStorageKey()
  const savedStamp = localStorage.getItem(stampKey)
  if (savedStamp) {
    setStampImage(savedStamp)
    setStampPreview(savedStamp)
  }
}, [])

// 2. 회사 정보로 폼 초기화 (company 변경 시)
useEffect(() => {
  if (company) {
    setFormData({...company})
  }
}, [company])
```

---

## 🚨 유효성 검사

### 도장 이미지 업로드
```typescript
// 1. 파일 크기 검사
if (file.size > 1024 * 1024) {
  onMessage('이미지 크기는 1MB 이하여야 합니다.', 'error')
  return
}

// 2. 파일 형식 검사
if (!file.type.startsWith('image/')) {
  onMessage('이미지 파일만 업로드 가능합니다.', 'error')
  return
}
```

### 필수 필드
```typescript
<input
  type="text"
  name="name"
  required  // HTML5 validation
  placeholder="회사명을 입력하세요"
/>
```

---

## 🎯 개선 아이디어

1. **도장 이미지 편집**
   - 크롭 기능
   - 회전, 반전
   - 배경 제거 도구

2. **사업자등록번호 포맷**
   - 자동 하이픈 추가 (000-00-00000)
   - 유효성 검사 (체크섬)

3. **전화번호 포맷**
   - 자동 하이픈 추가
   - 국제번호 지원

4. **메모 템플릿**
   - 자주 쓰는 메모 템플릿 저장
   - 변수 치환 기능 ({{계좌번호}})

5. **전자세금계산서 연동**
   - API 키 테스트 기능
   - 인증서 업로드

6. **다국어 지원**
   - 영문 회사명 필드
   - 영문 주소 필드

---

## ⚠️ 주의사항

1. **도장 이미지**
   - localStorage에 base64로 저장 (용량 주의)
   - 회사별로 분리 저장
   - 로그아웃 시에도 유지됨

2. **필수 필드**
   - 회사명과 사업자등록번호는 반드시 입력
   - 빈 값으로 저장 불가

3. **편집 모드**
   - 취소 시 이전 값으로 복원
   - 저장 전까지는 변경사항 유지 안됨

4. **세션 관리**
   - getCurrentSession()으로 현재 로그인 회사 확인
   - 회사별 도장 이미지 키 생성

5. **에러 처리**
   - mutation onError에서 에러 로깅
   - 사용자에게 친절한 에러 메시지
