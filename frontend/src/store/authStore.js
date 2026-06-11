import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      role: null,
      token: null,
      refreshToken: null,
      login: (user, token, refreshToken) =>
        set({ isAuthenticated: true, user, role: user.role, token, refreshToken }),
      setToken: (token) =>
        set({ token }),
      setUser: (user) =>
        set({ user }),
      logout: () =>
        set({ isAuthenticated: false, user: null, role: null, token: null, refreshToken: null }),
    }),
    { name: 'naatalfi-auth' }
  )
)

export default useAuthStore
