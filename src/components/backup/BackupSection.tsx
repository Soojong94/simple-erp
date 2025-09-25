import { Shield, ShieldCheck, Settings as SettingsIcon } from 'lucide-react'
import { getLastBackupDate, isTauriEnvironment, type BackupSettings, type BackupFileInfo } from '../../lib/backup'
import BackupStats from './BackupStats'
import BackupFolderSettings from './BackupFolderSettings'
import BackupActions from './BackupActions'
import BackupFileList from './BackupFileList'

interface BackupSectionProps {
  isBackingUp: boolean
  isRestoring: boolean
  isLoadingFiles: boolean
  autoBackupEnabled: boolean
  settings: BackupSettings
  backupFiles: BackupFileInfo[]
  onSelectFolder: () => void
  onOpenFolder: () => void
  onManualBackup: () => void
  onRestore: () => void
  onToggleAutoBackup: () => void
  onRefreshFiles: () => void
  onDeleteFile: (file: BackupFileInfo) => void
}

export default function BackupSection({
  isBackingUp,
  isRestoring,
  isLoadingFiles,
  autoBackupEnabled,
  settings,
  backupFiles,
  onSelectFolder,
  onOpenFolder,
  onManualBackup,
  onRestore,
  onToggleAutoBackup,
  onRefreshFiles,
  onDeleteFile
}: BackupSectionProps) {
  const isTauri = isTauriEnvironment()
  const lastBackupDate = getLastBackupDate()

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            💾 데이터 백업 관리
          </h3>
          <div className="flex items-center space-x-2">
            {autoBackupEnabled ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <ShieldCheck className="w-3 h-3 mr-1" />
                자동 백업 활성
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Shield className="w-3 h-3 mr-1" />
                자동 백업 비활성
              </span>
            )}
            
            {isTauri && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <SettingsIcon className="w-3 h-3 mr-1" />
                데스크톱 모드
              </span>
            )}
          </div>
        </div>

        {/* 백업 폴더 설정 (Tauri 환경에서만) */}
        {isTauri && (
          <BackupFolderSettings
            settings={settings}
            onSelectFolder={onSelectFolder}
            onOpenFolder={onOpenFolder}
          />
        )}

        {/* 백업 통계 */}
        <BackupStats />

        {/* 백업 정보 */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">마지막 백업</span>
            <span className="text-sm text-gray-900">
              {lastBackupDate 
                ? new Date(lastBackupDate).toLocaleDateString('ko-KR')
                : '백업 없음'
              }
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">백업 저장 위치</span>
            <span className="text-sm text-gray-900">
              {isTauri 
                ? (settings.backupPath ? '지정된 폴더' : '미설정')
                : '브라우저 다운로드 폴더'
              }
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">파일명 형식</span>
            <span className="text-sm text-gray-900 font-mono">simple-erp-backup-YYYY-MM-DD.json</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium text-gray-500">자동 백업 주기</span>
            <span className="text-sm text-gray-900">매일 1회 (데이터 변경 시)</span>
          </div>
        </div>

        {/* 백업 액션 버튼들 */}
        <BackupActions
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          isLoadingFiles={isLoadingFiles}
          autoBackupEnabled={autoBackupEnabled}
          showRefresh={isTauri && !!settings.backupPath}
          onManualBackup={onManualBackup}
          onRestore={onRestore}
          onToggleAutoBackup={onToggleAutoBackup}
          onRefreshFiles={onRefreshFiles}
        />

        {/* 백업 파일 목록 (Tauri 환경에서만) */}
        {isTauri && settings.backupPath && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">백업 파일 관리</h4>
            <BackupFileList
              isLoading={isLoadingFiles}
              files={backupFiles}
              onDeleteFile={onDeleteFile}
            />
          </div>
        )}
      </div>
    </div>
  )
}
