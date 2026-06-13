import { beforeEach, describe, expect, it } from 'vitest'
import useAuthStore from './authStore'

const fakeUser = { id: 'u1', email: 'test@naatalfi.com', role: 'VENDOR', first_name: 'Test' }

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    window.localStorage.clear()
  })

  it("démarre déconnecté, sans utilisateur ni token", () => {
    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(false)
    expect(s.user).toBeNull()
    expect(s.role).toBeNull()
    expect(s.token).toBeNull()
    expect(s.refreshToken).toBeNull()
  })

  it('login renseigne user, role, tokens et isAuthenticated', () => {
    useAuthStore.getState().login(fakeUser, 'access-123', 'refresh-456')
    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(true)
    expect(s.user).toEqual(fakeUser)
    expect(s.role).toBe('VENDOR')
    expect(s.token).toBe('access-123')
    expect(s.refreshToken).toBe('refresh-456')
  })

  it('setToken remplace le token sans toucher au reste', () => {
    useAuthStore.getState().login(fakeUser, 'old-token', 'refresh-456')
    useAuthStore.getState().setToken('new-token')
    const s = useAuthStore.getState()
    expect(s.token).toBe('new-token')
    expect(s.isAuthenticated).toBe(true)
    expect(s.refreshToken).toBe('refresh-456')
  })

  it('setUser met à jour le profil', () => {
    useAuthStore.getState().login(fakeUser, 't', 'r')
    useAuthStore.getState().setUser({ ...fakeUser, first_name: 'Modifié' })
    expect(useAuthStore.getState().user.first_name).toBe('Modifié')
  })

  it('logout remet tout à zéro', () => {
    useAuthStore.getState().login(fakeUser, 'access-123', 'refresh-456')
    useAuthStore.getState().logout()
    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(false)
    expect(s.user).toBeNull()
    expect(s.role).toBeNull()
    expect(s.token).toBeNull()
    expect(s.refreshToken).toBeNull()
  })

  it('persiste la session dans localStorage (clé naatalfi-auth)', () => {
    useAuthStore.getState().login(fakeUser, 'access-123', 'refresh-456')
    const raw = window.localStorage.getItem('naatalfi-auth')
    expect(raw).toBeTruthy()
    const persisted = JSON.parse(raw)
    expect(persisted.state.isAuthenticated).toBe(true)
    expect(persisted.state.token).toBe('access-123')
  })
})
