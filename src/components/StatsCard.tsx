/**
 * 统计数据卡片组件
 */

interface StatsCardProps {
    publishedCount: number
    upvotedCount: number
    totalUpvotesReceived: number
    joinDays: number
  }
  
  export default function StatsCard({
    publishedCount,
    upvotedCount,
    totalUpvotesReceived,
    joinDays
  }: StatsCardProps) {
    const stats = [
      { value: publishedCount, label: '发布了', color: 'text-blue-600' },
      { value: upvotedCount, label: '点赞了', color: 'text-red-600' },
      { value: totalUpvotesReceived, label: '获得赞', color: 'text-green-600' },
      { value: joinDays, label: '天', color: 'text-purple-600' }
    ]
  
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={`stat-${index + 1}`} className="text-center">
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }