'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Settings as SettingsIcon, User, Mail, Heart, Palette, Save, ArrowLeft, Users } from 'lucide-react'

interface Profile {
  id: string
  email: string
  display_name: string | null
  partner_id: string | null
  theme_preference: string
}

export default function SettingsPage() {
  const { user, setTheme, theme } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [currentPartnerEmail, setCurrentPartnerEmail] = useState('')
  const [friendEmail, setFriendEmail] = useState('') // New state for friends
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const themes = [
    { id: 'minimal', name: 'Minimal', color: '#ffffff' },
    { id: 'vintage', name: 'Vintage Paper', color: '#f5f1e8' },
    { id: 'scrapbook', name: 'Scrapbook', color: '#fffef9' },
    { id: 'storybook', name: 'Storybook', color: '#fefefe' },
  ]

  const loadProfile = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
    } else if (data) {
      setProfile(data)
      setDisplayName(data.display_name || '')
      
      if (data.partner_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', data.partner_id)
          .single()
        
        if (partner) {
          setPartnerEmail(partner.email)
          setCurrentPartnerEmail(partner.email)
        }
      } else {
        setPartnerEmail('')
        setCurrentPartnerEmail('')
      }
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user, loadProfile])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)

    try {
      let partnerId = profile?.partner_id || null

      const normalizedEmail = partnerEmail.trim().toLowerCase()
      const currentNormalized = currentPartnerEmail.trim().toLowerCase()
      const userEmailNormalized = (profile?.email || '').toLowerCase()

      // 1. Handle Primary Partner Connection/Unlinking
      if (!normalizedEmail) {
        // User cleared the field — unlink partner on both sides
        if (partnerId) {
          await supabase.from('profiles').update({ partner_id: null }).eq('id', partnerId)
        }
        partnerId = null
        setCurrentPartnerEmail('')
      } else if (normalizedEmail !== currentNormalized) {
        if (normalizedEmail === userEmailNormalized) {
          alert('You cannot link your own email as a partner.')
          setSaving(false)
          return
        }

        const { data: partner, error: partnerLookupError } = await supabase
          .from('profiles')
          .select('id, partner_id')
          .eq('email', normalizedEmail)
          .single()

        if (partnerLookupError || !partner) {
          alert('Partner email not found. Ensure your partner has signed up.')
          setSaving(false)
          return
        }

        if (partner.partner_id && partner.partner_id !== user.id) {
          alert('That partner is already linked to someone else.')
          setSaving(false)
          return
        }

        // unlink previous partner if exists
        if (partnerId && partnerId !== partner.id) {
          await supabase.from('profiles').update({ partner_id: null }).eq('id', partnerId)
        }

        partnerId = partner.id

        await supabase
          .from('profiles')
          .update({ partner_id: user.id })
          .eq('id', partner.id)
      }

      // 2. Handle Display Name and Theme Save (Primary Save)
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          partner_id: partnerId,
          theme_preference: theme,
        })
        .eq('id', user.id)

      if (error) throw error
      
      // 3. Handle Optional Friend Connection (New Logic)
      if (friendEmail.trim()) {
        const normalizedFriendEmail = friendEmail.trim().toLowerCase()
        setFriendEmail('') // Clear the input immediately after reading it

        if (normalizedFriendEmail === userEmailNormalized || normalizedFriendEmail === normalizedEmail) {
            alert('Cannot add your own email or your primary partner\'s email as a friend.')
        } else {
            const { data: friend, error: friendLookupError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', normalizedFriendEmail)
                .single()

            if (friendLookupError || !friend) {
                alert(`Friend email "${normalizedFriendEmail}" not found.`)
            } else {
                // Insert friend relationship (unidirectional for now)
                const { error: friendInsertError } = await supabase
                    .from('friend_relationships')
                    .insert({
                        user_id: user.id,
                        friend_id: friend.id,
                        relationship_type: 'friend',
                    })

                if (friendInsertError) {
                    if (friendInsertError.code === '23505') { // Unique constraint violation (already friends)
                        alert(`You are already friends with ${normalizedFriendEmail}.`)
                    } else {
                        throw friendInsertError
                    }
                } else {
                    alert(`Friend ${normalizedFriendEmail} added!`)
                }
            }
        }
    }


      alert('Settings saved!')
      loadProfile()
    } catch (error) {
      console.error('Error saving settings:', error)
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <SettingsIcon className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">Settings</h1>
          <p className="text-vintage-ink/70">Manage your account and preferences</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
              <User className="w-4 h-4" />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg bg-vintage-paper/30 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
              <Heart className="w-4 h-4" />
              Primary Partner Email
            </label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
              placeholder="partner@email.com"
            />
            <p className="mt-1 text-xs text-vintage-ink/60">
              Your main partner for shared journal, memories, and letters
            </p>
          </div>

          {/* New Section for Optional Friends (Added UI) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
              <Users className="w-4 h-4" />
              Add Optional Friend
            </label>
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
              placeholder="friend@email.com"
            />
            <p className="mt-1 text-xs text-vintage-ink/60">
              Add long-distance friends for future friend-based features.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-4">
              <Palette className="w-4 h-4" />
              Theme
            </label>
            <div className="grid grid-cols-2 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    theme === t.id
                      ? 'border-rose-gold bg-rose-gold/10'
                      : 'border-vintage-ink/20 hover:border-rose-gold/50'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded mb-2"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="font-semibold text-vintage-ink">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}