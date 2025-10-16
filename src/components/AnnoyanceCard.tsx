/**
 * 不爽卡片组件
 * 统一的卡片展示样式，支持点赞、删除等交互
 */

import { formatTimeAgo } from '@/lib/timeFormat'

// 不爽数据的类型定义
export interface Annoyance {
  id: number
  content: string
  category: string
  upvote_count: number
  created_at: string
  user_fingerprint: string
}

interface AnnoyanceCardProps {
  annoyance: Annoyance          // 不爽数据
  isUpvoted: boolean            // 是否已点赞
  isUpvoting?: boolean          // 是否正在点赞（加载状态）
  showDelete?: boolean          // 是否显示删除按钮
  isDeleting?: boolean          // 是否正在删除
  onUpvote: (id: number) => void       // 点赞回调
  onDelete?: (id: number) => void      // 删除回调（可选）
}

export default function AnnoyanceCard({
  annoyance,
  isUpvoted,
  isUpvoting = false,
  showDelete = false,
  isDeleting = false,
  onUpvote,
  onDelete
}: AnnoyanceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
      {/* 头部：时间 + 删除按钮 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          {formatTimeAgo(annoyance.created_at)}
        </span>
        
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(annoyance.id)}
            disabled={isDeleting}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {isDeleting ? '删除中...' : '删除'}
          </button>
        )}
      </div>

      {/* 主要内容 */}
      <p className="text-gray-800 mb-4 text-base leading-relaxed">
        {annoyance.content}
      </p>

      {/* 底部：分类标签 + 点赞按钮 */}
      <div className="flex items-center justify-between text-sm">
        {/* 分类标签 */}
        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600">
          {getCategoryLabel(annoyance.category)}
        </span>

        {/* 点赞按钮 */}
        <button 
          type="button"
          onClick={() => onUpvote(annoyance.id)}
          disabled={isUpvoted || isUpvoting}
          className={`px-4 py-1.5 rounded-full transition-all font-medium ${
            isUpvoted
              ? 'bg-red-600 text-white cursor-default'
              : 'bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105'
          } ${isUpvoting ? 'opacity-50 cursor-wait' : ''}`}
        >
          <span className="flex items-center gap-1">
            {isUpvoted ? '✓ 已不爽' : '😤 我也不爽'}
            <span className="font-semibold">{annoyance.upvote_count}</span>
          </span>
        </button>
      </div>
    </div>
  )
}

// 辅助函数：获取分类标签
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tool: '🔧 工具类',
    life: '🏠 生活类',
    work: '💼 工作类',
    study: '📚 学习类'
  }
  return labels[category] || category
}