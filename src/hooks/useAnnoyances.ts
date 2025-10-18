/**
 * 不爽列表的数据管理Hook
 * 负责：加载、提交、点赞等所有数据操作
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/userFingerprint'
import { Annoyance } from '@/components/AnnoyanceCard'

export function useAnnoyances() {
  const [annoyances, setAnnoyances] = useState<Annoyance[]>([])
  const [myUpvotes, setMyUpvotes] = useState<Set<number>>(new Set())
  const [isFirstLoading, setIsFirstLoading] = useState(true)
  const [upvoting, setUpvoting] = useState<number | null>(null)

  useEffect(() => {
    loadAnnoyances()
    loadMyUpvotes()
  }, [])

  async function loadAnnoyances() {
    try {
      const { data, error } = await supabase
        .from('annoyances')
        .select('*')
        .order('upvote_count', { ascending: false })
      
      if (error) throw error
      setAnnoyances(data || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setIsFirstLoading(false)
    }
  }

  async function loadMyUpvotes() {
    try {
      const fingerprint = getUserFingerprint()
      const { data, error } = await supabase
        .from('upvotes')
        .select('annoyance_id')
        .eq('user_fingerprint', fingerprint)
      
      if (error) throw error
      
      const upvotedIds = new Set(data?.map(item => item.annoyance_id) || [])
      setMyUpvotes(upvotedIds)
    } catch (error) {
      console.error('加载点赞记录失败:', error)
    }
  }

  async function submitAnnoyance(content: string, category: string) {
    try {
      const fingerprint = getUserFingerprint()
      
      const { error } = await supabase.from('annoyances').insert({
        content: content.trim(),
        category,
        user_fingerprint: fingerprint
      })
      
      if (error) throw error
      
      await loadAnnoyances()
      return { success: true }
    } catch (error) {
      console.error('提交失败:', error)
      return { success: false, error }
    }
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

      setAnnoyances(prev => 
        prev.map(item => 
          item.id === annoyanceId 
            ? { ...item, upvote_count: item.upvote_count + 1 }
            : item
        )
      )

      setMyUpvotes(prev => new Set([...prev, annoyanceId]))

    } catch (error) {
      console.error('点赞失败:', error)
      alert('点赞失败，请重试')
    } finally {
      setUpvoting(null)
    }
  }

  return {
    annoyances,
    myUpvotes,
    isFirstLoading,
    upvoting,
    submitAnnoyance,
    handleUpvote
  }
}