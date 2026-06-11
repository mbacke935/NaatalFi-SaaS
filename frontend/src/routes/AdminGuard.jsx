import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function AdminGuard() {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default AdminGuard
