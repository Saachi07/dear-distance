'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '../providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { 
  Heart, Mail, BookOpen, Images, Clock, Settings, 
  Plus, LogOut, User, ArrowRight 
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  display_name: string | null
  partner_id: string | null
}

export default function DashboardPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [letterCount, setLetterCount] = useState(0)
  const [journalCount, setJournalCount] = useState(0)
  const [memoryCount, setMemoryCount] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadData()
    }
  }, [user, loading, router])

  const loadData = async () => {
    if (!user) return

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }

    // Load counts
    const [lettersRes, journalRes, memoriesRes] = await Promise.all([
      supabase
        .from('letters')
        .select('id', { count: 'exact' })
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
      supabase
        .from('journal_entries')
        .select('id', { count: 'exact' })
        .or(`author_id.eq.${user.id},partner_id.eq.${user.id}`),
      supabase
        .from('memories')
        .select('id', { count: 'exact' })
        .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`),
    ])

    setLetterCount(lettersRes.count || 0)
    setJournalCount(journalRes.count || 0)
    setMemoryCount(memoriesRes.count || 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <Heart className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue">
      <nav className="bg-white/60 backdrop-blur-sm border-b border-rose-gold/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-rose-gold fill-rose-gold" />
            <span className="text-2xl font-handwriting text-vintage-ink">Letters</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 hover:bg-rose-gold/10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-vintage-ink" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-rose-gold/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-vintage-ink" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">
            Welcome back, {profile?.display_name || 'there'} 💕
          </h1>
          <p className="text-vintage-ink/70">
            {profile?.partner_id ? 'Connected with your partner' : 'Connect with your partner in settings'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/letters/new"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-dashed border-rose-gold/30 hover:border-rose-gold flex items-center justify-center flex-col gap-3 min-h-[200px]"
          >
            <Plus className="w-12 h-12 text-rose-gold" />
            <span className="text-lg font-semibold text-vintage-ink">Write a Letter</span>
          </Link>

          <Link
            href="/letters"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <Mail className="w-6 h-6 text-rose-gold" />
              </div>
              <ArrowRight className="w-5 h-5 text-vintage-ink/40 group-hover:text-rose-gold group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-semibold text-vintage-ink mb-2">My Letters</h3>
            <p className="text-vintage-ink/70 mb-2">{letterCount} letters</p>
            <p className="text-sm text-vintage-ink/60">View all your letters</p>
          </Link>

          <Link
            href="/journal"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-rose-gold" />
              </div>
              <ArrowRight className="w-5 h-5 text-vintage-ink/40 group-hover:text-rose-gold group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-semibold text-vintage-ink mb-2">Shared Journal</h3>
            <p className="text-vintage-ink/70 mb-2">{journalCount} entries</p>
            <p className="text-sm text-vintage-ink/60">Write back and forth</p>
          </Link>

          <Link
            href="/memories"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <Images className="w-6 h-6 text-rose-gold" />
              </div>
              <ArrowRight className="w-5 h-5 text-vintage-ink/40 group-hover:text-rose-gold group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-semibold text-vintage-ink mb-2">Memory Gallery</h3>
            <p className="text-vintage-ink/70 mb-2">{memoryCount} memories</p>
            <p className="text-sm text-vintage-ink/60">Timeline of moments</p>
          </Link>

          <Link
            href="/countdowns"
            className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-rose-gold/10 rounded-lg">
                <Clock className="w-6 h-6 text-rose-gold" />
              </div>
              <ArrowRight className="w-5 h-5 text-vintage-ink/40 group-hover:text-rose-gold group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-xl font-semibold text-vintage-ink mb-2">Countdowns</h3>
            <p className="text-vintage-ink/70 mb-2">Next reunion</p>
            <p className="text-sm text-vintage-ink/60">Track special dates</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
