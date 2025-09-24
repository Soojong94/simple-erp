export default function Reports() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">보고서</h1>
          <p className="mt-2 text-sm text-gray-700">
            매출, 매입 및 기타 통계 보고서를 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 매출 보고서 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">매출 보고서</h3>
                <p className="text-sm text-gray-500 mt-1">
                  기간별 매출 현황 및 추이 분석
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 transition-colors">
                보고서 보기
              </button>
            </div>
          </div>
        </div>

        {/* 매입 보고서 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <span className="text-red-600 text-sm font-medium">📉</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">매입 보고서</h3>
                <p className="text-sm text-gray-500 mt-1">
                  기간별 매입 현황 및 비용 분석
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors">
                보고서 보기
              </button>
            </div>
          </div>
        </div>

        {/* 거래처별 보고서 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">거래처별 보고서</h3>
                <p className="text-sm text-gray-500 mt-1">
                  거래처별 매출/매입 현황 분석
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors">
                보고서 보기
              </button>
            </div>
          </div>
        </div>

        {/* 상품별 보고서 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">상품별 보고서</h3>
                <p className="text-sm text-gray-500 mt-1">
                  상품별 판매량 및 수익성 분석
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-yellow-50 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-100 transition-colors">
                보고서 보기
              </button>
            </div>
          </div>
        </div>

        {/* 세금 보고서 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">세금 보고서</h3>
                <p className="text-sm text-gray-500 mt-1">
                  부가세 및 세금계산서 현황
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-purple-50 text-purple-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors">
                보고서 보기
              </button>
            </div>
          </div>
        </div>

        {/* 월별 요약 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <h3 className="text-lg font-medium text-gray-900">월별 요약</h3>
                <p className="text-sm text-gray-500 mt-1">
                  월별 종합 실적 요약 보고서
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                보고서 보기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">빠른 통계</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">-</div>
              <div className="text-sm text-gray-500">이번 달 매출</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">-</div>
              <div className="text-sm text-gray-500">이번 달 매입</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">-</div>
              <div className="text-sm text-gray-500">총 거래건수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">-</div>
              <div className="text-sm text-gray-500">활성 거래처</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
