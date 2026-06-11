import api from './api'

// Phase 7 — Validation panier
export const validateCart      = (items)          => api.post('/orders/validate/', { items })

// Acheteur
export const createOrder       = (data)           => api.post('/orders/', data)
export const getMyOrders       = ()               => api.get('/orders/me/')
export const getMyOrder        = (id)             => api.get(`/orders/me/${id}/`)
export const cancelOrder       = (id)             => api.post(`/orders/me/${id}/cancel/`)

// Vendeur
export const getVendorOrders   = (params)         => api.get('/vendors/me/orders/', { params })
export const getVendorOrder    = (id)             => api.get(`/vendors/me/orders/${id}/`)
export const updateOrderStatus = (id, newStatus)  => api.patch(`/vendors/me/orders/${id}/status/`, { status: newStatus })
