/**
 * 加载骨架屏组件
 * 在数据加载时显示占位动画，提升用户体验
 */

interface LoadingSkeletonProps {
    count?: number  // 显示几个骨架屏，默认3个
  }
  
  export default function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`skeleton-${index + 1}`}
            className="bg-white rounded-lg shadow-md p-5 animate-pulse"
          >
            {/* 内容区域 - 模拟3行文字 */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
  
            {/* 底部区域 - 模拟标签和按钮 */}
            <div className="flex items-center justify-between mt-4">
              <div className="h-6 bg-gray-200 rounded-full w-20"></div> 
              <div className="h-8 bg-gray-200 rounded-full w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }