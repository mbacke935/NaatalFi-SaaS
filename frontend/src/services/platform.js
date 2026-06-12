import api from './api'

export const getPublicPlatformSettings = () => api.get('/platform/public/')
export const getAdminPlatformSettings = () => api.get('/platform/admin/')
export const updateAdminPlatformSettings = (data) => api.patch('/platform/admin/', data)

