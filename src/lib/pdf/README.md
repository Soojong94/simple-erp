# PDF 라이브러리

이 디렉토리에는 거래명세서 PDF 생성 관련 파일만 유지합니다.

## 파일 목록
- `index.ts` - 메인 PDF 생성 함수
- `pdfConfig.ts` - 레이아웃 설정
- `README.md` - 이 파일

## 삭제된 파일들
다음 파일들은 개발 과정에서 생성된 테스트 파일들로 삭제되었습니다:
- canvasInvoice.ts, canvasInvoice-v2.ts (Canvas API 방식 - 미사용)
- invoiceTemplate.ts (템플릿 방식 - 미사용)
- index-v2.ts, index-v5-current-backup.ts (백업 파일들)
- index-test1.ts ~ index-test5.ts (테스트 버전들)
- index-v3-note.txt, index-v4-note.txt (노트 파일들)
- VERSION_HISTORY.md (이 README로 통합)

## 최종 버전 정보
- **날짜**: 2025-09-27
- **설정**: 300mm 렌더링 → 210mm PDF
- **특징**: 
  - Transform 없음 (자연스러운 폰트)
  - Scale: 2 (빠른 생성)
  - Bold 강화 (font-weight: 600-800)
  - 절취선 추가 (점선)
- **파일명 형식**: `거래명세서_거래처명_날짜.pdf`
