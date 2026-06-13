import { beforeEach, describe, expect, it } from 'vitest'
import useAuthStore from './authStore'

const fakeUser = { id: 'u1', email: 'test@naatalfi.com', role: 'VENDOR', first_name: 'Test' }

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    window.localStorage.clear()
  })

  it('demarre deconnecte, sans utilisateur ni token', () => {
    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(false)
    expect(s.user).toBeNull()
    expect(s.role).toBeNull()
    expect(s.token).toBeNull()
  })

  it('login renseigne user, role, token en memoire et isAuthenticated', () => {
    useAuthStore.getState().login(fakeUser, 'access-123')
    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(true)
    expect(s.user).toEqual(fakeUser)
    expect(s.role).toBe('VENDOR')
    expect(s.token).toBe('access-123')
  })

  it('setToken remplace le token sans toucher au reste', () => {
    useAuthStore.getState().login(fakeUser, 'old-token')
    useAuthStore.getState().setToken('new-token')
    const s = useAuthStore.getState()
    expect(s.token).toBe('new-token')
    expect(s.isAuthenticated).toBe(true)
  })

  it('setUser met a jour le profil', () => {
    useAuthStore.getState().login(fakeUser, 't')
    useAuthStore.getState().setUser({ ...fakeUser, first_name: 'Modifie' })
    expect(useAuthStore.getState().user.first_name).toBe('Modifie')
  })

  it('logout remet tout a zero', () => {
    useAuthStore.getState().login(fakeUser, 'access-123')
    useAuthStore.getState().logout()
    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(false)
    expect(s.user).toBeNull()
    expect(s.role).toBeNull()
    expect(s.token).toBeNull()
  })

  it('persiste uniquement les infos non sensibles dans localStorage', () => {
    useAuthStore.getState().login(fakeUser, 'access-123')
    const raw = window.localStorage.getItem('naatalfi-auth')
    expect(raw).toBeTruthy()
    const persisted = JSON.parse(raw)
    expect(persisted.state.isAuthenticated).toBe(true)
    expect(persisted.state.user).toEqual(fakeUser)
    expect(persisted.state.role).toBe('VENDOR')
    expect(persisted.state.token).toBeUndefined()
    expect(persisted.state.refreshToken).toBeUndefined()
  })
})
