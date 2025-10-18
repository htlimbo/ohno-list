/**
 * 我的不爽页面的数据管理Hook
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/userFingerprint'
import { Annoyance } from '@/components/AnnoyanceCard'

interface Stats {
  publishedCount: number
  upvotedCount: number
  totalUpvotesReceived: number
  joinDays: number
}

export function useMyData() {
  const [myAnnoyances, setMyAnnoyances] = useState<Annoyance[]>([])
  const [upvotedAnnoyances, setUpvotedAnnoyances] = useState<Annoyance[]>([])
  const [myUpvotes, setMyUpvotes] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [upvoting, setUpvoting] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats>({
    publishedCount: 0,
    upvotedCount: 0,
    totalUpvotesReceived: 0,
    joinDays: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const fingerprint = getUserFingerprint()

      // 1. 加载我发布的
      const { data: myData, error: myError } = await supabase
        .from('annoyances')
        .select('*')
        .eq('user_fingerprint', fingerprint)
        .order('created_at', { ascending: false })

      if (myError) throw myError
      setMyAnnoyances(myData || [])

      // 2. 加载我点赞过的ID
      const { data: upvotesData, error: upvotesError } = await supabase
        .from('upvotes')
        .select('annoyance_id, created_at')
        .eq('user_fingerprint', fingerprint)
        .order('created_at', { ascending: false })

      if (upvotesError) throw upvotesError

      const upvotedIds = upvotesData?.map(item => item.annoyance_id) || []
      setMyUpvotes(new Set(upvotedIds))

      // 3. 加载我点赞的不爽详情
      if (upvotedIds.length > 0) {
        const { data: upvotedData, error: upvotedError } = await supabase
          .from('annoyances')
          .select('*')
          .in('id', upvotedIds)

        if (upvotedError) throw upvotedError

        const sortedData = upvotedIds
          .map(id => upvotedData?.find(item => item.id === id))
          .filter(Boolean) as Annoyance[]

        setUpvotedAnnoyances(sortedData)
      }

      // 4. 计算统计数据
      calculateStats(myData || [], upvotedIds.length)

    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function calculateStats(myData: Annoyance[], upvotedCount: number) {
    const totalUpvotes = myData.reduce((sum, item) => sum + item.upvote_count, 0)
    
    let joinDays = 0
    if (myData.length > 0) {
      const firstPost = new Date(myData[myData.length - 1].created_at)
      const now = new Date()
      joinDays = Math.floor((now.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24))
    }

    setStats({
      publishedCount: myData.length,
      upvotedCount,
      totalUpvotesReceived: totalUpvotes,
      joinDays
    })
  }

  async function handleUpvote(annoyanceId: number) {
    if (myUpvotes.has(annoyanceId) || upvoting === annoyanceId) {
      return
    }

    setUpvoting(annoyanceId)

    try {
      const fingerprint = getUserFingerprint()

      const { error: upvoteError } = await supabase
        .from('upvotes')
        .insert({
          annoyance_id: annoyanceId,
          user_fingerprint: fingerprint
        })

      if (upvoteError) {
        if (upvoteError.code === '23505') {
          setMyUpvotes(prev => new Set([...prev, annoyanceId]))
          return
        }
        throw upvoteError
      }

      const { error: updateError } = await supabase.rpc('increment_upvote', {
        annoyance_id: annoyanceId
      })

      if (updateError) throw updateError

      // 更新本地状态
      updateAnnoyanceUpvote(annoyanceId, 1)
      setMyUpvotes(prev => new Set([...prev, annoyanceId]))

    } catch (error) {
      console.error('点赞失败:', error)
      alert('点赞失败，请重试')
    } finally {
      setUpvoting(null)
    }
  }

  async function handleDelete(annoyanceId: number) {
    if (!confirm('确定要删除这条不爽吗？')) {
      return
    }

    setDeleting(annoyanceId)

    try {
      const { error: deleteUpvotesError } = await supabase
        .from('upvotes')
        .delete()
        .eq('annoyance_id', annoyanceId)

      if (deleteUpvotesError) throw deleteUpvotesError

      const { error: deleteError } = await supabase
        .from('annoyances')
        .delete()
        .eq('id', annoyanceId)

      if (deleteError) throw deleteError

      setMyAnnoyances(prev => prev.filter(item => item.id !== annoyanceId))
      setStats(prev => ({
        ...prev,
        publishedCount: prev.publishedCount - 1
      }))

      alert('✅ 删除成功')

    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setDeleting(null)
    }
  }

  async function handleCancelUpvote(annoyanceId: number) {
    if (!confirm('确定要取消点赞吗？')) {
      return
    }

    setDeleting(annoyanceId)

    try {
      const fingerprint = getUserFingerprint()

      const { error: deleteError } = await supabase
        .from('upvotes')
        .delete()
        .eq('annoyance_id', annoyanceId)
        .eq('user_fingerprint', fingerprint)

      if (deleteError) throw deleteError

      const { error: decrementError } = await supabase.rpc('decrement_upvote', {
        annoyance_id: annoyanceId
      })

      if (decrementError) throw decrementError

      setUpvotedAnnoyances(prev => prev.filter(item => item.id !== annoyanceId))
      setMyUpvotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(annoyanceId)
        return newSet
      })
      setStats(prev => ({
        ...prev,
        upvotedCount: prev.upvotedCount - 1
      }))

      alert('✅ 已取消点赞')

    } catch (error) {
      console.error('取消点赞失败:', error)
      alert('取消点赞失败，请重试')
    } finally {
      setDeleting(null)
    }
  }

  function updateAnnoyanceUpvote(id: number, delta: number) {
    setMyAnnoyances(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, upvote_count: item.upvote_count + delta }
          : item
      )
    )

    setUpvotedAnnoyances(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, upvote_count: item.upvote_count + delta }
          : item
      )
    )
  }

  return {
    myAnnoyances,
    upvotedAnnoyances,
    myUpvotes,
    isLoading,
    upvoting,
    deleting,
    stats,
    handleUpvote,
    handleDelete,
    handleCancelUpvote
  }
}