'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Heart, Mail, Lock, User, Loader } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First check if email already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        setError('This email is already registered. Please sign in instead.')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (signUpError) {
        // Try signing in — user may already exist with same credentials
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            // Provide clearer guidance for common messages
            const msg = signInError.message || ''
            if (msg.includes('Invalid login credentials') || msg.includes('Invalid password')) {
              setError('Invalid credentials. If you already have an account, try resetting your password.')
            } else if (msg.includes('already registered') || msg.includes('User already exists')) {
              setError('This email is already registered. Please sign in instead.')
            } else {
              // Unknown sign-in error — fall back to showing signUp error
              throw signUpError
            }
            return
          }

          if (signInData?.user) {
            // Signed in successfully — redirect
            router.push('/dashboard')
            router.refresh()
            return
          }
        } catch (siErr) {
          console.error('Sign-in fallback error:', siErr)
          throw signUpError
        }
      }

      if (data.user) {
        // Create profile using RPC to bypass RLS
        const { error: profileError } = await supabase
          .rpc('create_user_profile', {
            user_id: data.user.id,
            user_email: email,
            user_display_name: displayName,
          })

        if (profileError) {
          setError('Account created but profile setup failed. Please sign in and complete your profile.')
          console.error('Profile creation error:', profileError)
          return
        }

        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Heart className="w-16 h-16 mx-auto text-rose-gold fill-rose-gold mb-4" />
            <h1 className="text-3xl font-handwriting text-vintage-ink mb-2">Start Your Story</h1>
            <p className="text-vintage-ink/70">Create an account to begin</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-vintage-ink/40" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-vintage-ink/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-vintage-ink/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-vintage-ink/60">At least 6 characters</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-gold text-white py-3 rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-vintage-ink/70">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-rose-gold hover:underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
