import api from './api'

// Profil
export const getProfile    = ()         => api.get('/account/profile/')
export const updateProfile = (data)     => api.patch('/account/profile/', data)

// Commandes client
export const getAccountOrders      = ()   => api.get('/account/orders/')
export const getAccountOrder       = (id) => api.get(`/account/orders/${id}/`)

// Adresses
export const getAddresses    = ()        => api.get('/account/addresses/')
export const createAddress   = (data)    => api.post('/account/addresses/', data)
export const updateAddress   = (id, data) => api.patch(`/account/addresses/${id}/`, data)
export const deleteAddress   = (id)      => api.delete(`/account/addresses/${id}/`)

// Favoris
export const getFavorites    = ()          => api.get('/account/favorites/')
export const addFavorite     = (productId) => api.post(`/account/favorites/${productId}/`)
export const removeFavorite  = (productId) => api.delete(`/account/favorites/${productId}/`)
