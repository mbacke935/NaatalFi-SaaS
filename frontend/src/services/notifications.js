import api from './api'

export const getNotifications = (params) => api.get('/notifications/', { params })
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read/`)
export const markAllNotificationsRead = () => api.post('/notifications/read-all/')

