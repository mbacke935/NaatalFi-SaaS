import api from './api'
import axios from 'axios'

const pub = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const getVendorAds = () => api.get('/vendors/me/ads/')
export const createVendorAd = (data) => api.post('/vendors/me/ads/', data)
export const updateVendorAd = (id, data) => api.patch(`/vendors/me/ads/${id}/`, data)
export const getAdminAds = (params) => api.get('/ads/admin/', { params })
export const getSponsoredProducts = () => pub.get('/ads/sponsored/')
export const trackAdClick = (id) => pub.post(`/ads/${id}/click/`)

