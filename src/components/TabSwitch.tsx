/**
 * Tab切换组件
 */

export type TabType = 'published' | 'upvoted'

interface TabSwitchProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  publishedCount: number
  upvotedCount: number
}

export default function TabSwitch({
  activeTab,
  onTabChange,
  publishedCount,
  upvotedCount
}: TabSwitchProps) {
  const tabs = [
    { value: 'published' as TabType, label: '📝 我发布的', count: publishedCount },
    { value: 'upvoted' as TabType, label: '❤️ 我点赞的', count: upvotedCount }
  ]

  return (
    <div className="flex gap-2 mb-6">
      {tabs.map(tab => (
        <button
          type="button"
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            activeTab === tab.value
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  )
}