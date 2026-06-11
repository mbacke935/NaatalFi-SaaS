import api from './api'

export const getWallet       = ()       => api.get('/wallet/')
export const getTransactions = (params) => api.get('/wallet/transactions/', { params })
export const getPayouts      = (params) => api.get('/wallet/payouts/', { params })
export const requestPayout   = (data)   => api.post('/wallet/payouts/', data)

// Admin
export const adminGetWallets    = ()           => api.get('/wallet/admin/')
export const adminGetPayouts    = (params)     => api.get('/wallet/admin/payouts/', { params })
export const adminApprovePayout = (id, note)   => api.patch(`/wallet/admin/payouts/${id}/approve/`, { admin_note: note ?? '' })
export const adminRejectPayout  = (id, note)   => api.patch(`/wallet/admin/payouts/${id}/reject/`, { admin_note: note ?? '' })
