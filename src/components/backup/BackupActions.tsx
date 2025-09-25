import { Download, Upload, Shield, ShieldCheck, RefreshCw } from 'lucide-react'

interface BackupActionsProps {
  isBackingUp: boolean
  isRestoring: boolean
  isLoadingFiles: boolean
  autoBackupEnabled: boolean
  showRefresh: boolean
  onManualBackup: () => void
  onRestore: () => void
  onToggleAutoBackup: () => void
  onRefreshFiles: () => void
}

export default function BackupActions({
  isBackingUp,
  isRestoring,
  isLoadingFiles,
  autoBackupEnabled,
  showRefresh,
  onManualBackup,
  onRestore,
  onToggleAutoBackup,
  onRefreshFiles
}: BackupActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        type="button"
        onClick={onManualBackup}
        disabled={isBackingUp}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        <Download className="w-4 h-4 mr-2" />
        {isBackingUp ? '백업 중...' : '수동 백업'}
      </button>

      <button
        type="button"
        onClick={onRestore}
        disabled={isRestoring}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isRestoring ? '복원 중...' : '백업 복원'}
      </button>

      <button
        type="button"
        onClick={onToggleAutoBackup}
        className={`inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md ${
          autoBackupEnabled
            ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'
            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
        }`}
      >
        {autoBackupEnabled ? (
          <>
            <Shield className="w-4 h-4 mr-2" />
            자동 백업 비활성화
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 mr-2" />
            자동 백업 활성화
          </>
        )}
      </button>

      {showRefresh && (
        <button
          type="button"
          onClick={onRefreshFiles}
          disabled={isLoadingFiles}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
          목록 새로고침
        </button>
      )}
    </div>
  )
}
