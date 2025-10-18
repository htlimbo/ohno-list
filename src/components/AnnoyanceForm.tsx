/**
 * 发布不爽的表单组件
 */

'use client'

import { useState } from 'react'

interface AnnoyanceFormProps {
  onSubmit: (content: string, category: string) => Promise<{ success: boolean; error?: any }>
}

export default function AnnoyanceForm({ onSubmit }: AnnoyanceFormProps) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('tool')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    setIsLoading(true)
    const result = await onSubmit(content, category)
    setIsLoading(false)

    if (result.success) {
      setContent('')
      alert('✅ 发布成功！')
    } else {
      alert('提交失败，请重试')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="什么让你不爽？(按Enter提交，Shift+Enter换行)"
        aria-label="输入不爽内容"
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
      
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          aria-label="选择不爽分类"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="tool">🔧 工具类</option>
          <option value="life">🏠 生活类</option>
          <option value="work">💼 工作类</option>
          <option value="study">📚 学习类</option>
        </select>
        
        <button 
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !content.trim()}
          className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? '发布中...' : '发布不爽'}
        </button>
      </div>
    </div>
  )
}