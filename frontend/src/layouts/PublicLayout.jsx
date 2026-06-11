import { Outlet } from 'react-router-dom'
import PublicNav from '../components/layout/PublicNav'

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#0B0B0F]">
      <PublicNav />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default PublicLayout
