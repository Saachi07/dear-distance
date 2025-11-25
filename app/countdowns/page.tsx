'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { fetchPartnerId } from '@/lib/partner'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Clock, Plus, ArrowLeft } from 'lucide-react'

interface Countdown {
  id: string
  title: string
  target_date: string
  is_active: boolean
}

export default function CountdownsPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [countdowns, setCountdowns] = useState<Countdown[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    target_date: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadCountdowns = useCallback(async () => {
    if (!user) return

    const partnerId = await fetchPartnerId(supabase, user.id)

    if (!partnerId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('countdowns')
      .select('*')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq('is_active', true)
      .order('target_date', { ascending: true })

    if (error) {
      console.error('Error loading countdowns:', error)
    } else {
      setCountdowns(data || [])
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      loadCountdowns()
    }
  }, [user, loadCountdowns])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)

    try {
      const partnerId = await fetchPartnerId(supabase, user.id)

      if (!partnerId) {
        alert('Please connect with your partner in settings first')
        return
      }

      const { error } = await supabase
        .from('countdowns')
        .insert({
          user_id: user.id,
          partner_id: partnerId,
          title: formData.title,
          target_date: new Date(formData.target_date).toISOString(),
        })

      if (error) throw error

      setFormData({ title: '', target_date: '' })
      setShowForm(false)
      loadCountdowns()
    } catch (error) {
      console.error('Error creating countdown:', error)
      const message = error instanceof Error ? error.message : 'Failed to create countdown'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <Clock className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">Countdowns</h1>
            <p className="text-vintage-ink/70">Track special dates together</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Countdown
          </button>
        </div>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="Next reunion..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Target Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Countdown'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-white border border-vintage-ink/20 text-vintage-ink rounded-lg font-semibold hover:bg-vintage-paper/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {countdowns.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <Clock className="w-16 h-16 mx-auto text-rose-gold mb-4" />
            <h2 className="text-2xl font-semibold text-vintage-ink mb-2">No countdowns yet</h2>
            <p className="text-vintage-ink/70">Create a countdown to track your next special moment!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {countdowns.map((countdown) => (
              <CountdownTimer
                key={countdown.id}
                targetDate={countdown.target_date}
                title={countdown.title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
