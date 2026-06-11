import api from './api'
import axios from 'axios'

const pub = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const createReview = (data) => api.post('/reviews/', data)
export const getMyReviews = () => api.get('/reviews/me/')
export const getProductReviews = (slug) => pub.get(`/marketplace/products/${slug}/reviews/`)
export const getVendorReviews = (slug) => pub.get(`/marketplace/vendors/${slug}/reviews/`)
export const getAdminReviews = (params) => api.get('/reviews/admin/', { params })
export const deleteAdminReview = (id) => api.delete(`/reviews/admin/${id}/`)

