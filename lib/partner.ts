import { SupabaseClient } from '@supabase/supabase-js'

export async function fetchPartnerId(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('partner_id')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching partner id:', error)
    return null
  }

  return data?.partner_id ?? null
}

