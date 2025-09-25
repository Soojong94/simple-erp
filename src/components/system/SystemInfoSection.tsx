import { isTauriEnvironment, type BackupSettings } from '../../lib/backup'

interface SystemInfoSectionProps {
  backupSettings: BackupSettings
}

export default function SystemInfoSection({ backupSettings }: SystemInfoSectionProps) {
  const isTauri = isTauriEnvironment()

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          ⚙️ 시스템 정보
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">앱 버전</span>
            <span className="text-sm text-gray-900">Simple ERP v1.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">데이터 저장소</span>
            <span className="text-sm text-gray-900">
              {isTauri ? 'SQLite + localStorage' : 'localStorage (브라우저)'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">백업 위치</span>
            <span className="text-sm text-gray-900">
              {isTauri 
                ? (backupSettings.backupPath ? '지정된 로컬 폴더' : '브라우저 다운로드 폴더') 
                : '브라우저 다운로드 폴더'
              }
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium text-gray-500">실행 환경</span>
            <span className="text-sm text-gray-900">
              {isTauri ? 'Tauri Desktop App' : 'Web Browser (Development)'}
            </span>
          </div>
        </div>
        
        {/* 사용자 도움말 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">사용 팁</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 데스크톱 앱에서는 백업 폴더를 지정하여 자동 백업을 설정할 수 있습니다</li>
            <li>• 백업 파일은 무제한 보관되므로 필요에 따라 직접 정리하세요</li>
            <li>• 중요한 데이터 변경 전에는 수동 백업을 방실하지 마세요</li>
            {isTauri && (
              <li>• 폴더 열기 버튼으로 백업 파일들을 직접 관리할 수 있습니다</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
