import api from './api'

export const getAdminStats    = ()       => api.get('/orders/admin/stats/')
export const getAdminUsers    = (params) => api.get('/auth/admin/users/', { params })
export const updateAdminUser  = (id, data) => api.patch(`/auth/admin/users/${id}/`, data)
export const getAdminOrders   = (params) => api.get('/orders/admin/', { params })
export const getAdminProducts = (params) => api.get('/products/admin/', { params })
export const updateAdminProduct = (id, data) => api.patch(`/products/admin/${id}/`, data)
export const getAdminPayments = (params) => api.get('/payments/admin/', { params })
