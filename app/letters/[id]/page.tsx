import React from 'react'
import LetterViewClient from './LetterViewClient'

export async function generateStaticParams() {
  // Sample fetch: first try to use NEXT_PUBLIC_SUPABASE_* env; otherwise fallback to an example endpoint.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let letters: { id: string }[] = []

  try {
    if (supabaseUrl && anonKey) {
      const url = `${supabaseUrl}/rest/v1/letters?select=id`
      const res = await fetch(url, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      })
      if (res.ok) letters = await res.json()
    } else {
      // Fallback/sample endpoint for local/testing builds. Replace with your data source.
      const res = await fetch('https://example.com/letters')
      if (res.ok) letters = await res.json()
    }
  } catch (err) {
    console.error('generateStaticParams error:', err)
  }

  return letters.map((l) => ({ id: l.id }))
}

export default function Page({ params }: { params: { id: string } }) {
  return <LetterViewClient id={params.id} />
}
