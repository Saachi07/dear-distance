'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Session, User } from '@supabase/supabase-js'

interface UserContextType {
  user: User | null
  session: Session | null
  loading: boolean
  theme: string
  setTheme: (theme: string) => void
}

const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  loading: true,
  theme: 'minimal',
  setTheme: () => {},
})

export const useUser = () => useContext(UserContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<string>('minimal')

  useEffect(() => {
    const supabase = createSupabaseClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Load theme preference
    if (session?.user) {
      supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.theme_preference) {
            setTheme(data.theme_preference)
          }
        })
    }

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Apply theme class to html element
    document.documentElement.className = `theme-${theme}`
  }, [theme])

  return (
    <UserContext.Provider value={{ user, session, loading, theme, setTheme }}>
      {children}
    </UserContext.Provider>
  )
}
