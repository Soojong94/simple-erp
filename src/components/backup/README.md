# Backup Components

데이터 백업 및 복원 시스템을 위한 컴포넌트 모음

## 📋 파일 목록

### 1. BackupSection.tsx
**역할**: 백업 시스템의 메인 통합 컴포넌트

**기능**
- 전체 백업 UI 통합
- 데스크톱/웹 모드 구분
- 자동/수동 백업 상태 표시
- 하위 컴포넌트 조합 및 데이터 전달

**Props**
```typescript
interface BackupSectionProps {
  isBackingUp: boolean              // 백업 진행 중 여부
  isRestoring: boolean              // 복원 진행 중 여부
  isLoadingFiles: boolean           // 파일 목록 로딩 중
  autoBackupEnabled: boolean        // 자동 백업 활성화 상태
  settings: BackupSettings          // 백업 설정 (폴더 경로 등)
  backupFiles: BackupFileInfo[]     // 백업 파일 목록
  onSelectFolder: () => void        // 폴더 선택 핸들러
  onOpenFolder: () => void          // 폴더 열기 핸들러
  onManualBackup: () => void        // 수동 백업 핸들러
  onRestore: () => void             // 복원 핸들러
  onToggleAutoBackup: () => void    // 자동 백업 토글
  onRefreshFiles: () => void        // 파일 목록 새로고침
  onDeleteFile: (file) => void      // 파일 삭제 핸들러
}
```

**표시 정보**
- 마지막 백업 날짜
- 백업 저장 위치
- 파일명 형식
- 자동 백업 주기

---

### 2. BackupStats.tsx
**역할**: 현재 데이터 통계를 카드 형태로 표시

**기능**
- `collectBackupData()` 함수로 실시간 데이터 수집
- 거래처, 상품, 거래, 가격, 총 레코드 수 표시
- 색상으로 구분된 통계 카드

**표시 항목**
- 거래처 수 (파란색)
- 상품 수 (녹색)
- 거래 수 (보라색)
- 가격 수 (주황색)
- 총 레코드 수 (회색)

**의존성**
```typescript
import { collectBackupData } from '../../lib/backup'
```

---

### 3. BackupFolderSettings.tsx
**역할**: 백업 폴더 경로 설정 및 관리 (Tauri 전용)

**기능**
- 현재 백업 폴더 경로 표시
- 폴더 선택/변경 버튼
- 폴더 열기 버튼 (경로 설정 시)

**Props**
```typescript
interface BackupFolderSettingsProps {
  settings: BackupSettings    // 현재 백업 설정
  onSelectFolder: () => void  // 폴더 선택 다이얼로그
  onOpenFolder: () => void    // 파일 탐색기에서 열기
}
```

**UI 특징**
- 파란색 배경의 설정 패널
- 경로를 monospace 폰트로 표시
- 경로 미설정 시 안내 메시지

---

### 4. BackupActions.tsx
**역할**: 백업 관련 액션 버튼 모음

**기능**
- 수동 백업 실행
- 백업 복원
- 자동 백업 활성화/비활성화
- 파일 목록 새로고침 (Tauri + 폴더 설정 시)

**Props**
```typescript
interface BackupActionsProps {
  isBackingUp: boolean           // 백업 진행 중
  isRestoring: boolean           // 복원 진행 중
  isLoadingFiles: boolean        // 파일 로딩 중
  autoBackupEnabled: boolean     // 자동 백업 상태
  showRefresh: boolean           // 새로고침 버튼 표시 여부
  onManualBackup: () => void
  onRestore: () => void
  onToggleAutoBackup: () => void
  onRefreshFiles: () => void
}
```

**버튼 상태**
- 진행 중일 때 disabled 및 텍스트 변경
- 자동 백업 활성/비활성에 따라 색상 변경
- 새로고침 버튼에 스피너 애니메이션

**아이콘**
- Download: 수동 백업
- Upload: 복원
- Shield/ShieldCheck: 자동 백업
- RefreshCw: 새로고침

---

### 5. BackupFileList.tsx
**역할**: 저장된 백업 파일 목록 표시 및 관리 (Tauri 전용)

**기능**
- 백업 파일 목록 표시
- 파일 정보 (이름, 생성일, 크기, 레코드 수)
- 파일 삭제 기능
- 로딩 및 빈 상태 처리

**Props**
```typescript
interface BackupFileListProps {
  isLoading: boolean              // 로딩 상태
  files: BackupFileInfo[]         // 파일 목록
  onDeleteFile: (file) => void    // 파일 삭제 핸들러
}
```

**표시 정보**
- 파일명
- 레코드 수
- 생성 날짜 (한국 시간)
- 파일 크기 (formatFileSize로 포맷)

**상태별 UI**
- 로딩 중: 스피너 + 안내 메시지
- 파일 없음: 폴더 아이콘 + 안내 메시지
- 파일 있음: 파일 카드 리스트

---

### 6. BackupMessage.tsx
**역할**: 백업/복원 결과 메시지 표시

**기능**
- 성공/에러/정보 메시지 표시
- 타입에 따른 색상 구분
- 아이콘 표시

**Props**
```typescript
interface BackupMessageProps {
  message: string                      // 표시할 메시지
  type: 'success' | 'error' | 'info'  // 메시지 타입
}
```

**타입별 스타일**
- `success`: 녹색 배경, CheckCircle 아이콘
- `error`: 빨간색 배경, AlertCircle 아이콘
- `info`: 파란색 배경, AlertCircle 아이콘

---

## 🔄 컴포넌트 관계도

```
BackupSection (메인)
├── BackupFolderSettings (Tauri only)
│   └── 폴더 선택/열기 버튼
├── BackupStats
│   └── 데이터 통계 카드
├── BackupActions
│   └── 백업/복원/자동백업/새로고침 버튼
└── BackupFileList (Tauri only)
    └── 파일 카드 + 삭제 버튼

BackupMessage (독립적)
└── 결과 메시지 표시
```

---

## 💡 사용 예시

### Settings 페이지에서 사용
```typescript
import BackupSection from '@/components/backup/BackupSection'
import BackupMessage from '@/components/backup/BackupMessage'

function Settings() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  return (
    <div>
      <BackupSection
        isBackingUp={isBackingUp}
        isRestoring={false}
        isLoadingFiles={false}
        autoBackupEnabled={true}
        settings={{ backupPath: 'C:/backups' }}
        backupFiles={[]}
        onSelectFolder={handleSelectFolder}
        onOpenFolder={handleOpenFolder}
        onManualBackup={handleManualBackup}
        onRestore={handleRestore}
        onToggleAutoBackup={handleToggleAutoBackup}
        onRefreshFiles={handleRefreshFiles}
        onDeleteFile={handleDeleteFile}
      />
      
      {message && (
        <BackupMessage message={message.text} type={message.type} />
      )}
    </div>
  )
}
```

---

## 🔧 의존성

### 라이브러리
```typescript
import { lucide-react } from 'lucide-react'
```

### 내부 모듈
```typescript
import { 
  getLastBackupDate,
  isTauriEnvironment,
  collectBackupData,
  formatFileSize,
  type BackupSettings,
  type BackupFileInfo
} from '../../lib/backup'
```

---

## 🎯 주요 특징

### 1. 환경 감지
- `isTauriEnvironment()`로 데스크톱/웹 모드 구분
- Tauri 환경에서만 폴더 설정 및 파일 목록 표시

### 2. 상태 관리
- 진행 중 상태를 disabled로 처리
- 로딩 중 스피너 표시
- 빈 상태에 대한 친절한 안내

### 3. 사용자 경험
- 한국어 메시지
- 명확한 아이콘
- 색상으로 구분된 액션
- 실시간 통계 표시

### 4. 접근성
- 버튼에 명확한 레이블
- disabled 상태 시각적 표시
- 키보드 네비게이션 지원

---

## 📝 개선 아이디어

1. **백업 스케줄링**
   - 시간대 선택 기능
   - 주기적 백업 설정 UI

2. **파일 압축**
   - ZIP 형식 지원
   - 압축률 표시

3. **클라우드 백업**
   - Google Drive 연동
   - Dropbox 연동

4. **백업 검증**
   - 백업 파일 무결성 체크
   - 복원 전 미리보기

5. **버전 관리**
   - 백업 버전 비교
   - 차이점 표시
