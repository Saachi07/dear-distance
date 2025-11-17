import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing Supabase credentials:', {
      url: url ? '✓' : '✗ NEXT_PUBLIC_SUPABASE_URL',
      key: key ? '✓' : '✗ NEXT_PUBLIC_SUPABASE_ANON_KEY',
    })
    throw new Error('Your project\'s URL and Key are required to create a Supabase client!')
  }

  return createBrowserClient(url, key)
}

export const createSupabaseServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
