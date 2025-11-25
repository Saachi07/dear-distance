'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Calendar, Plus, ArrowLeft, Lock, Unlock } from 'lucide-react'
import { format } from 'date-fns'
import { decrypt, encrypt } from '@/lib/encryption'
import { fetchPartnerId } from '@/lib/partner'

interface TimeCapsule {
  id: string
  title: string
  content_encrypted: string
  open_date: string
  is_opened: boolean
  opened_at: string | null
  created_at: string
}

export default function TimeCapsulesPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    open_date: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadCapsules = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('time_capsules')
      .select('*')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('open_date', { ascending: true })

    if (error) {
      console.error('Error loading time capsules:', error)
    } else {
      setCapsules(data || [])
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      loadCapsules()
    }
  }, [user, loadCapsules])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)

    try {
      if (!formData.open_date) {
        alert('Pick an opening date for the capsule')
        return
      }

      const openDate = new Date(formData.open_date)
      if (Number.isNaN(openDate.getTime()) || openDate <= new Date()) {
        alert('Choose a future date for your time capsule.')
        return
      }

      const encryptedContent = encrypt(formData.content)

      const partnerId = await fetchPartnerId(supabase, user.id)

      const { error } = await supabase
        .from('time_capsules')
        .insert({
          user_id: user.id,
          partner_id: partnerId,
          title: formData.title,
          content_encrypted: encryptedContent,
          open_date: openDate.toISOString(),
        })

      if (error) throw error

      setFormData({ title: '', content: '', open_date: '' })
      setShowForm(false)
      loadCapsules()
    } catch (error) {
      console.error('Error creating time capsule:', error)
      const message = error instanceof Error ? error.message : 'Failed to create time capsule'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const openCapsule = async (capsule: TimeCapsule) => {
    if (!capsule.is_opened && new Date(capsule.open_date) <= new Date()) {
      await supabase
        .from('time_capsules')
        .update({
          is_opened: true,
          opened_at: new Date().toISOString(),
        })
        .eq('id', capsule.id)
      
      loadCapsules()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <Calendar className="w-16 h-16" />
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
            <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">Time Capsules</h1>
            <p className="text-vintage-ink/70">Messages from the past, opened in the future</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Capsule
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
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="Future message..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none min-h-[200px]"
                  placeholder="Write your message to the future..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Open Date</label>
                <input
                  type="date"
                  value={formData.open_date}
                  onChange={(e) => setFormData({ ...formData, open_date: e.target.value })}
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Capsule'}
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

        {capsules.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-rose-gold mb-4" />
            <h2 className="text-2xl font-semibold text-vintage-ink mb-2">No time capsules yet</h2>
            <p className="text-vintage-ink/70">Create your first time capsule!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {capsules.map((capsule) => {
              const isFuture = new Date(capsule.open_date) > new Date()

              return (
                <div
                  key={capsule.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-vintage-ink">{capsule.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-vintage-ink/70 mt-2">
                        <Calendar className="w-4 h-4" />
                        Opens: {format(new Date(capsule.open_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {isFuture ? (
                      <Lock className="w-5 h-5 text-rose-gold" />
                    ) : capsule.is_opened ? (
                      <Unlock className="w-5 h-5 text-green-500" />
                    ) : (
                      <button
                        onClick={() => openCapsule(capsule)}
                        className="px-4 py-2 bg-rose-gold text-white rounded-lg hover:bg-rose-gold/90 transition-all"
                      >
                        Open Now
                      </button>
                    )}
                  </div>
                  {capsule.is_opened && (
                    <div className="mt-4 p-4 bg-vintage-paper/30 rounded-lg">
                      <p className="text-vintage-ink whitespace-pre-wrap">
                        {decrypt(capsule.content_encrypted)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

