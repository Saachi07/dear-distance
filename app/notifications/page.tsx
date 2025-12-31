'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Bell, Mail, ImageIcon, BookOpen, Calendar, Heart } from 'lucide-react'
import { format } from 'date-fns'
import { fetchPartnerId } from '@/lib/partner'

interface Notification {
  id: string
  activity_type: string
  activity_data: Record<string, unknown> | null
  created_at: string
  user: { display_name: string; email: string }
}

export default function NotificationsPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPartner, setHasPartner] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) return

    const partnerId = await fetchPartnerId(supabase, user.id)
    setHasPartner(Boolean(partnerId))

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        user:profiles!activities_user_id_fkey(display_name, email)
      `)
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error loading notifications:', error)
    } else {
      setNotifications(data || [])
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user, loadNotifications])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'letter_sent':
      case 'letter_opened':
        return <Mail className="w-5 h-5 text-rose-gold" />
      case 'memory_added':
        return <ImageIcon className="w-5 h-5 text-rose-gold" />
      case 'journal_entry':
        return <BookOpen className="w-5 h-5 text-rose-gold" />
      default:
        return <Heart className="w-5 h-5 text-rose-gold" />
    }
  }

  const getNotificationMessage = (notification: Notification) => {
    const userName = notification.user?.display_name || notification.user?.email || 'Someone'
    const isOwnActivity = notification.user?.email === user?.email

    switch (notification.activity_type) {
      case 'letter_sent':
        return isOwnActivity ? 'You sent a letter' : `${userName} sent you a letter`
      case 'letter_opened':
        return isOwnActivity ? 'You opened a letter' : `${userName} opened a letter you sent`
      case 'memory_added':
        return isOwnActivity ? 'You added a memory' : `${userName} added a new memory`
      case 'journal_entry':
        return isOwnActivity ? 'You wrote a journal entry' : `${userName} wrote a journal entry`
      default:
        return 'Something sweet happened'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <Bell className="w-16 h-16" />
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

        <div className="mb-8">
          <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">Notifications</h1>
          <p className="text-vintage-ink/70">
            {hasPartner
              ? 'Updates from your partner and shared spaces appear here.'
              : 'Connect with your partner in settings to see updates here.'}
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-rose-gold mb-4" />
            <h2 className="text-2xl font-semibold text-vintage-ink mb-2">No notifications yet</h2>
            <p className="text-vintage-ink/70">
              {hasPartner
                ? 'You and your partner will see updates here as you share more moments.'
                : 'Write letters, add memories, and connect a partner anytime to see shared updates.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg flex items-start gap-4"
              >
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.activity_type)}
                </div>
                <div className="flex-1">
                  <p className="text-vintage-ink font-semibold mb-1">
                    {getNotificationMessage(notification)}
                  </p>
                  <p className="text-vintage-ink/60 text-sm">
                    {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
