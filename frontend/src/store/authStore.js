import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      role: null,
      token: null,
      login: (user, token) =>
        set({ isAuthenticated: true, user, role: user.role, token }),
      setToken: (token) =>
        set({ token }),
      setUser: (user) =>
        set({ user }),
      logout: () =>
        set({ isAuthenticated: false, user: null, role: null, token: null }),
    }),
    {
      name: 'naatalfi-auth',
      version: 2,
      migrate: (persistedState) => ({
        isAuthenticated: Boolean(persistedState?.isAuthenticated),
        user: persistedState?.user ?? null,
        role: persistedState?.role ?? persistedState?.user?.role ?? null,
        token: null,
      }),
      partialize: ({ isAuthenticated, user, role }) => ({ isAuthenticated, user, role }),
    }
  )
)

export default useAuthStore
