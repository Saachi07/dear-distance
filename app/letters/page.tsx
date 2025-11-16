'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Mail, Lock, Calendar, Plus, Heart, ArrowRight } from 'lucide-react'

interface Letter {
  id: string
  title: string
  sender_id: string
  recipient_id: string | null
  scheduled_reveal_at: string | null
  is_unlocked: boolean
  opened_at: string | null
  created_at: string
  sender: { display_name: string }
}

export default function LettersPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadLetters()
    }
  }, [user])

  const loadLetters = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('letters')
      .select(`
        *,
        sender:profiles!letters_sender_id_fkey(display_name)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading letters:', error)
    } else {
      setLetters(data || [])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <Heart className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-handwriting text-vintage-ink">My Letters</h1>
          <Link
            href="/letters/new"
            className="flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Letter
          </Link>
        </div>

        {letters.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <Mail className="w-16 h-16 mx-auto text-rose-gold mb-4" />
            <h2 className="text-2xl font-semibold text-vintage-ink mb-2">No letters yet</h2>
            <p className="text-vintage-ink/70 mb-6">Start writing your first letter!</p>
            <Link
              href="/letters/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all"
            >
              <Plus className="w-5 h-5" />
              Write Your First Letter
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {letters.map((letter) => (
              <Link
                key={letter.id}
                href={`/letters/${letter.id}`}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-vintage-ink group-hover:text-rose-gold transition-colors">
                        {letter.title}
                      </h3>
                      {!letter.is_unlocked && (
                        <Lock className="w-5 h-5 text-rose-gold" />
                      )}
                      {letter.scheduled_reveal_at && new Date(letter.scheduled_reveal_at) > new Date() && (
                        <Calendar className="w-5 h-5 text-rose-gold" />
                      )}
                    </div>
                    <p className="text-vintage-ink/70 text-sm mb-2">
                      {letter.sender_id === user?.id ? 'To: You' : `From: ${letter.sender?.display_name || 'Someone'}`}
                    </p>
                    <p className="text-vintage-ink/60 text-xs">
                      {new Date(letter.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {letter.scheduled_reveal_at && (
                        <span className="ml-2">
                          • Unlocks: {new Date(letter.scheduled_reveal_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-vintage-ink/40 group-hover:text-rose-gold group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
