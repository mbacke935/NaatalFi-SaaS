import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function VendorGuard() {
  const { isAuthenticated, role } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (role === 'ADMIN') return <Navigate to="/admin" replace />
  if (role !== 'VENDOR') return <Navigate to="/account" replace />
  return <Outlet />
}

export default VendorGuard
