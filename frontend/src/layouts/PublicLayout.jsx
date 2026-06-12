import { Outlet } from 'react-router-dom'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'

function PublicLayout() {
  return (
    <div className="min-h-dvh bg-[#0B0B0F] flex flex-col">
      <PublicNav />
      <main className="min-w-0 lg:flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
