/**
 * 将时间戳转换为相对时间显示
 * @param dateString - ISO格式的时间字符串，如 "2024-10-16T08:30:00Z"
 * @returns 格式化后的时间字符串，如 "5分钟前"、"昨天 14:30"
 */
export function formatTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    
    // 计算时间差（毫秒）
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
  
    // 1分钟内
    if (diffSeconds < 60) {
      return '刚刚'
    }
  
    // 1小时内
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`
    }
  
    // 24小时内
    if (diffHours < 24) {
      return `${diffHours}小时前`
    }
  
    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  
    // 今年内
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  
    // 更早的时间
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }