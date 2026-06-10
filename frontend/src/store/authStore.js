import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      role: null, // 'admin' | 'vendor' | 'customer'
      token: null,
      login: (user, token) =>
        set({ isAuthenticated: true, user, role: user.role, token }),
      logout: () =>
        set({ isAuthenticated: false, user: null, role: null, token: null }),
    }),
    { name: 'naatalfi-auth' }
  )
)

export default useAuthStore
