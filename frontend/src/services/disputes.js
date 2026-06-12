import api from './api'

export const getMyDisputes = () => api.get('/disputes/')
export const createDispute = (data) => api.post('/disputes/', data)
export const getDispute = (id) => api.get(`/disputes/${id}/`)
export const getVendorDisputes = () => api.get('/vendors/me/disputes/')
export const getAdminDisputes = (params) => api.get('/disputes/admin/', { params })
export const resolveAdminDispute = (id, data) => api.post(`/disputes/admin/${id}/resolve/`, data)

