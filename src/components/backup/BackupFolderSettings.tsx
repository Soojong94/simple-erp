import { Folder, FolderOpen } from 'lucide-react'
import { BackupSettings } from '../../lib/backup'

interface BackupFolderSettingsProps {
  settings: BackupSettings
  onSelectFolder: () => void
  onOpenFolder: () => void
}

export default function BackupFolderSettings({ 
  settings, 
  onSelectFolder, 
  onOpenFolder 
}: BackupFolderSettingsProps) {
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-2">백업 폴더 설정</h4>
          {settings.backupPath ? (
            <div>
              <p className="text-sm text-blue-700 mb-2">현재 백업 위치:</p>
              <p className="text-xs font-mono text-blue-800 bg-blue-100 p-2 rounded break-all">
                {settings.backupPath}
              </p>
            </div>
          ) : (
            <p className="text-sm text-blue-700">
              백업 폴더가 설정되지 않았습니다. 폴더를 선택하면 자동으로 해당 위치에 백업됩니다.
            </p>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <button
          type="button"
          onClick={onSelectFolder}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
        >
          <Folder className="w-4 h-4 mr-1" />
          {settings.backupPath ? '폴더 변경' : '폴더 선택'}
        </button>
        
        {settings.backupPath && (
          <button
            type="button"
            onClick={onOpenFolder}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            폴더 열기
          </button>
        )}
      </div>
    </div>
  )
}
