import { Outlet } from 'react-router-dom'
import PublicNav from '../components/layout/PublicNav'
import PublicFooter from '../components/layout/PublicFooter'

function PublicLayout() {
  return (
    <div className="min-h-dvh bg-[#0B0B0F] flex flex-col">
      <PublicNav />
      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout
