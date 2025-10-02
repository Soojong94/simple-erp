# Invoice Components

⚠️ **주의: 이 폴더의 컴포넌트는 현재 프로젝트에서 사용되지 않습니다.**

## 📌 현재 상태

이 컴포넌트는 **구현되어 있지만 UI에서 연결되지 않은 레거시 코드**입니다.

### 실제 사용 중인 PDF 생성 방식

**lib/pdf/** 폴더에서 직접 PDF 생성 함수를 호출하여 사용:
- `generateInvoicePDF()` - 거래명세서 생성
- Transactions 페이지 등에서 직접 호출

---

## 📋 파일 목록 (미사용)

### InvoicePreviewModal.tsx

**역할**: 거래명세서 PDF 미리보기 및 출력 모달 (미연결)

**의도된 기능**
- PDF 미리보기 표시
- PDF 다운로드 버튼
- 인쇄 버튼
- 회사 정보 + 거래처 정보 자동 로드

**구현 내용**
```typescript
interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionWithItems   // 거래 정보
}

// 주요 기능
- generateInvoicePDF(transaction, company, customer, 'preview')
- generateInvoicePDF(transaction, company, customer, 'download')  
- generateInvoicePDF(transaction, company, customer, 'print')
```

**모달 구성**
1. 헤더: 제목 + 거래처명 + 거래일
2. PDF 뷰어: iframe으로 미리보기
3. 버튼: 다운로드, 인쇄, 닫기

---

## 🤔 왜 사용하지 않나요?

추측하건대:

1. **직접 호출이 더 간단**
   - 모달 없이 바로 PDF 생성
   - 버튼 하나로 다운로드/인쇄

2. **미리보기 필요성 낮음**
   - PDF 생성이 빠름
   - 바로 다운로드해도 문제없음

3. **UX 개선 필요**
   - 모달 열기 → 로딩 → 미리보기 (단계 많음)
   - 바로 다운로드 (단계 적음)

---

## 💡 사용하려면?

### Transactions 페이지에 적용 예시
```typescript
import InvoicePreviewModal from '../components/invoice/InvoicePreviewModal'

function Transactions() {
  const [previewTransaction, setPreviewTransaction] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  const handleShowPreview = (transaction) => {
    setPreviewTransaction(transaction)
    setIsPreviewOpen(true)
  }
  
  return (
    <>
      {/* 테이블에서 미리보기 버튼 */}
      <button onClick={() => handleShowPreview(transaction)}>
        📄 명세서 미리보기
      </button>
      
      {/* 모달 */}
      <InvoicePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        transaction={previewTransaction}
      />
    </>
  )
}
```

---

## 🔧 구현된 기능

### PDF 생성
```typescript
// lib/pdf/index.ts의 함수 사용
generateInvoicePDF(
  transaction,  // 거래 정보
  company,      // 회사 정보
  customer,     // 거래처 정보
  mode          // 'preview' | 'download' | 'print'
)
```

### 미리보기
```typescript
const pdf = await generateInvoicePDF(transaction, company, customer, 'preview')
const blob = pdf.output('blob')
const url = URL.createObjectURL(blob)
setPdfUrl(url)

// iframe으로 표시
<iframe src={pdfUrl} className="w-full h-full" />
```

---

## 🗑️ 제거 고려사항

**삭제해도 되는 경우**
- ✅ 현재 직접 PDF 생성 방식에 만족
- ✅ 미리보기 기능 필요 없음
- ✅ 코드베이스 정리가 목적

**유지하는 경우**
- 🔄 나중에 미리보기 기능 추가할 수도
- 🔄 사용자 요청이 있을 수도
- 🔄 코드 참고용으로 보관

---

## 📝 개발자 노트

**구현 상태**
- ✅ 코드는 완성되어 있음
- ✅ PDF 생성 로직 완료
- ✅ 미리보기 iframe 구현
- ❌ UI에 연결되지 않음
- ❌ 사용자에게 노출되지 않음

**현재 대체 방식**
- lib/pdf 함수를 직접 호출
- 모달 없이 바로 다운로드/인쇄

**결정이 필요합니다:**
1. 삭제하고 코드를 정리할 것인가?
2. UI에 연결해서 사용할 것인가?
3. 그냥 두고 필요시 사용할 것인가?

---

## 💡 개선 아이디어 (사용한다면)

1. **로딩 상태 개선**
   - 스피너 표시
   - 진행률 표시

2. **에러 처리**
   - 친절한 에러 메시지
   - 재시도 버튼

3. **키보드 단축키**
   - ESC: 닫기
   - Ctrl+P: 인쇄
   - Ctrl+S: 다운로드

4. **확대/축소**
   - 줌 인/아웃 버튼
   - 페이지 넘김

5. **이메일 발송**
   - PDF를 이메일로 전송
   - 거래처 이메일 자동 입력
