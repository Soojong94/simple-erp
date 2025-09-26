import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../lib/utils'

interface CustomerSalesData {
  name: string
  value: number
  color: string
}

interface CustomerSalesPieChartProps {
  data: CustomerSalesData[]
  isLoading: boolean
}

export default function CustomerSalesPieChart({ data, isLoading }: CustomerSalesPieChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 거래처별 매출 비중</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 거래처별 매출 비중</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm">매출 데이터가 없습니다</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 거래처별 매출 비중</h3>
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
        {/* 차트 */}
        <div className="w-full lg:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* 범례 */}
        <div className="w-full lg:w-1/2 space-y-2">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center flex-1 min-w-0">
                <div 
                  className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-700 truncate">{entry.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 ml-2">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
