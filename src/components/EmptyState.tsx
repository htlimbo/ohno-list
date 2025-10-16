/**
 * 空状态组件
 * 当列表为空时显示友好的提示信息
 */

interface EmptyStateProps {
    icon?: string              // 显示的emoji，默认 "📭"
    title: string              // 主标题
    description?: string       // 描述文字（可选）
    actionText?: string        // 按钮文字（可选）
    onAction?: () => void      // 按钮点击事件（可选）
  }
  
  export default function EmptyState({
    icon = '📭',
    title,
    description,
    actionText,
    onAction
  }: EmptyStateProps) {
    return (
      <div className="text-center py-16 px-4">
        {/* Emoji图标 */}
        <div className="text-6xl mb-4">
          {icon}
        </div>
  
        {/* 主标题 */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {title}
        </h3>
  
        {/* 描述文字（可选） */}
        {description && (
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {description}
          </p>
        )}
  
        {/* 行动按钮（可选） */}
        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {actionText}
          </button>
        )}
      </div>
    )
  }