'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Mail, BookOpen, Images, Clock, Settings } from 'lucide-react'
import { useUser } from '@/app/providers'

export function Navigation() {
  const pathname = usePathname()
  const { user } = useUser()

  if (!user) return null

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Heart },
    { href: '/letters', label: 'Letters', icon: Mail },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/memories', label: 'Memories', icon: Images },
    { href: '/countdowns', label: 'Countdowns', icon: Clock },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="bg-white/60 backdrop-blur-sm border-t border-rose-gold/20 fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
                  isActive ? 'text-rose-gold' : 'text-vintage-ink/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
