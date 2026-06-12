import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function PrivateRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export default PrivateRoute
