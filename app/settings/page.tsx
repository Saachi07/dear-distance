'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Save, User, Mail, Heart, Loader2, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [displayName, setDisplayName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load current profile
  const loadProfile = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, partner_id')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
    } else if (data) {
      setDisplayName(data.display_name || '')
      
      // If user has a partner, fetch partner's details
      if (data.partner_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', data.partner_id)
          .single()
        
        if (partner) {
          setPartnerName(partner.display_name || partner.email)
        }
      }
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)

    try {
      // 1. Update Display Name
      const { error: nameError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id)

      if (nameError) throw nameError

      // 2. Handle Partner Connection (if email provided)
      if (partnerEmail.trim()) {
        // A. Find the partner by email
        const { data: partnerData, error: searchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', partnerEmail.toLowerCase().trim())
          .single()

        if (searchError || !partnerData) {
          throw new Error('Partner email not found. Ask them to sign up first!')
        }

        if (partnerData.id === user.id) {
          throw new Error('You cannot connect with yourself!')
        }

        // B. Update YOUR profile to link to them
        const { error: linkError } = await supabase
          .from('profiles')
          .update({ partner_id: partnerData.id })
          .eq('id', user.id)

        if (linkError) throw linkError
        
        // Refresh to show connection
        await loadProfile()
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setPartnerEmail('') // Clear email field on success
      
    } catch (error: any) {
      console.error('Update error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-handwriting text-vintage-ink mb-8">Settings</h1>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Display Name Section */}
            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                placeholder="What should we call you?"
              />
            </div>

            {/* Partner Connection Section */}
            <div className="pt-4 border-t border-vintage-ink/10">
              <label className="block text-sm font-medium text-vintage-ink mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-gold" />
                Partner Connection
              </label>
              
              {partnerName ? (
                <div className="flex items-center gap-3 p-4 bg-rose-gold/10 rounded-lg text-vintage-ink">
                  <Heart className="w-5 h-5 text-rose-gold fill-rose-gold" />
                  <span>Connected with <strong>{partnerName}</strong></span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-vintage-ink/60 mb-2">
                    Enter your partner&apos;s email to connect accounts. 
                    <br />
                    <span className="text-xs italic">(They must sign up first!)</span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      className="flex-1 px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                      placeholder="partner@email.com"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </form>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-vintage-ink/20 text-vintage-ink rounded-lg font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}