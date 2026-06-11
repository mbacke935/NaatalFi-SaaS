import api from './api'

export const register = (data) =>
  api.post('/auth/register/', data)

export const verifyEmail = (uid, token) =>
  api.post('/auth/verify-email/', { uid, token })

export const login = (email, password) =>
  api.post('/auth/login/', { email, password })

export const logout = (refresh) =>
  api.post('/auth/logout/', { refresh })

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password/', { email })

export const resetPassword = (uid, token, password) =>
  api.post('/auth/reset-password/', { uid, token, password })

export const getMe = () =>
  api.get('/auth/me/')

export const updateMe = (data) =>
  api.patch('/auth/me/', data)
