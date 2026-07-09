import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/for-you', label: 'For You' },
  { to: '/settings', label: 'Settings' },
]

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper'
    : 'rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-ink'
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-paper/90 sticky top-0 z-10 border-b border-stone-200 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link to="/" className="font-serif text-2xl font-semibold tracking-tight">
          News<span className="text-accent">Hub</span>
        </Link>

        <nav className="hidden gap-1 sm:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} end>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="hover:text-ink rounded-full p-2 text-stone-600 sm:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav
          className="flex flex-col gap-1 border-t border-stone-200 px-4 py-3 sm:hidden"
          aria-label="Main mobile"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={navLinkClass}
              end
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
