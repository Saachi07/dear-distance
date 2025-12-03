'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Settings as SettingsIcon, User, Mail, Heart, Palette, Save, ArrowLeft, Users, Plus, X } from 'lucide-react'

// Interface update: added a new array field to track current friends
interface Profile {
  id: string
  email: string
  display_name: string | null
  partner_id: string | null
  theme_preference: string
}

// Separate interface for the friend list item
interface FriendItem {
    id: string
    display_name: string | null
    email: string
}

export default function SettingsPage() {
  const { user, setTheme, theme } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [currentPartnerEmail, setCurrentPartnerEmail] = useState('')
  const [friendEmail, setFriendEmail] = useState('')
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]) // State to hold current friends
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const themes = [
    { id: 'minimal', name: 'Minimal', color: '#ffffff' },
    { id: 'vintage', name: 'Vintage Paper', color: '#f5f1e8' },
    { id: 'scrapbook', name: 'Scrapbook', color: '#fffef9' },
    { id: 'storybook', name: 'Storybook', color: '#fefefe' },
  ]

  // FIX: Simplified loading logic to avoid complex joins in one query
  const loadProfile = useCallback(async () => {
    if (!user) return

    // 1. Fetch core profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      console.error('Error loading profile:', profileError)
      setLoading(false)
      return
    }

    setProfile(profileData)
    setDisplayName(profileData.display_name || '')

    const partnerId = profileData.partner_id;

    // 2. Fetch Partner Email (if exists)
    if (partnerId) {
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', partnerId)
        .single()
      
      if (partnerData) {
        setPartnerEmail(partnerData.email)
        setCurrentPartnerEmail(partnerData.email)
      }
    } else {
      setPartnerEmail('')
      setCurrentPartnerEmail('')
    }
    
    // 3. Fetch Friends List
    const { data: friendsData, error: friendsError } = await supabase
        .from('friend_relationships')
        .select(`
            friend_id,
            friend:profiles!friend_relationships_friend_id_fkey(display_name, email)
        `)
        .eq('user_id', user.id)

    if (!friendsError && friendsData) {
        const mappedFriends: FriendItem[] = friendsData.map((f: any) => ({
            id: f.friend_id,
            display_name: Array.isArray(f.friend) && f.friend.length > 0 ? f.friend[0].display_name : null,
            email: Array.isArray(f.friend) && f.friend.length > 0 ? f.friend[0].email : 'Unknown',
        }));
        setFriendsList(mappedFriends);
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

        // The RLS fix in schema.sql should allow this lookup to succeed now.
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

        if (partnerId && partnerId !== partner.id) {
          await supabase.from('profiles').update({ partner_id: null }).eq('id', partnerId)
        }

        partnerId = partner.id

        await supabase
          .from('profiles')
          .update({ partner_id: user.id })
          .eq('id', partner.id)
      }

      // 2. Handle Display Name and Theme Save (Primary Save) - Now more stable
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          partner_id: partnerId,
          theme_preference: theme,
        })
        .eq('id', user.id)

      if (error) throw error
      
      // 3. Handle Optional Friend Connection (Finalized Logic for adding a new friend)
      if (friendEmail.trim()) {
        const normalizedFriendEmail = friendEmail.trim().toLowerCase()
        setFriendEmail('') 

        if (normalizedFriendEmail === userEmailNormalized || normalizedFriendEmail === normalizedEmail) {
            alert('Cannot add your own email or your primary partner\'s email as a friend.')
        } else {
            // This lookup now relies on the RLS fix in schema.sql
            const { data: friend, error: friendLookupError } = await supabase
                .from('profiles')
                .select('id, display_name')
                .eq('email', normalizedFriendEmail)
                .single()

            if (friendLookupError || !friend) {
                alert(`Friend email "${normalizedFriendEmail}" not found.`)
            } else {
                const { error: friendInsertError } = await supabase
                    .from('friend_relationships')
                    .insert({
                        user_id: user.id,
                        friend_id: friend.id,
                        relationship_type: 'friend',
                    })
                    .select()

                if (friendInsertError) {
                    if (friendInsertError.code === '23505') { 
                        alert(`You are already friends with ${normalizedFriendEmail}.`)
                    } else {
                        throw friendInsertError
                    }
                } else {
                    alert(`Friend ${friend.display_name || normalizedFriendEmail} added!`)
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

  // New function to remove a friend
  const handleRemoveFriend = async (friendId: string, friendName: string | null) => {
    const name = friendName || 'this friend';
    if (!user || !window.confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
        setSaving(true);
        const { error } = await supabase
            .from('friend_relationships')
            .delete()
            .match({ user_id: user.id, friend_id: friendId });

        if (error) throw error;
        
        alert(`${name} removed from friends.`);
        loadProfile();
    } catch (error) {
        console.error('Error removing friend:', error);
        alert('Failed to remove friend.');
    } finally {
        setSaving(false);
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

          <div className="border p-4 rounded-xl space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-vintage-ink">
                <Heart className="w-5 h-5 text-rose-gold" />
                Connection Management
            </h2>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
                Primary Partner Email (Max 1)
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

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
                Add Friends
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="flex-1 px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="friend@email.com"
                />
                <button
                  type="button"
                  onClick={handleSave} // Calls handleSave which executes friend add logic
                  disabled={saving || !friendEmail.trim()}
                  className="px-4 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50"
                  title="Add Friend"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-vintage-ink/60">
                Add long-distance friends for future friend-based features.
              </p>
            </div>
            
            {friendsList && friendsList.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-vintage-ink mt-4 mb-2 flex items-center gap-1">
                        <Users className="w-4 h-4" /> Your Friends ({friendsList.length})
                    </h3>
                    <ul className="space-y-2">
                        {friendsList.map((friend) => (
                            <li key={friend.id} className="flex items-center justify-between p-3 bg-vintage-paper/60 rounded-lg">
                                <span className="text-vintage-ink">{friend.display_name || friend.email}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFriend(friend.id, friend.display_name)}
                                    disabled={saving}
                                    className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50 flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" /> Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
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