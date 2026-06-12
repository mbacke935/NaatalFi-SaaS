import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function AdminGuard() {
  const { isAuthenticated, role } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default AdminGuard
