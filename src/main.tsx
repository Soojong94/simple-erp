import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './globals.css'

// 개발 환경에서 테스트 데이터 생성 함수를 전역에 노출
if (import.meta.env.DEV) {
  import('./lib/testData').then(({ generateTestData, clearAllData }) => {
    // @ts-ignore
    window.generateTestData = generateTestData
    // @ts-ignore
    window.clearAllData = clearAllData
    
    console.log('🎲 테스트 데이터 생성 명령어:')
    console.log('  generateTestData() - 랜덤 테스트 데이터 생성')
    console.log('  clearAllData() - 모든 데이터 삭제')
  })
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
