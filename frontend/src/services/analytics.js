import api from './api'

export const getAdminAnalyticsOverview = (params) => api.get('/analytics/admin/overview/', { params })
export const getAdminAnalyticsVendors = (params) => api.get('/analytics/admin/vendors/', { params })
export const getVendorAnalytics = (params) => api.get('/analytics/vendors/me/', { params })

