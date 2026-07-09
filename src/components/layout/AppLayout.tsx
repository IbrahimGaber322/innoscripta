import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
        <Outlet />
      </main>
    </div>
  )
}
