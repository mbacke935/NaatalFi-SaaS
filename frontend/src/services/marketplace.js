import api from './api'
import axios from 'axios'

// Instance publique sans token (pour les pages sans auth)
const pub = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const getMarketplaceProducts = (params) =>
  pub.get('/marketplace/products/', { params })

export const getMarketplaceProduct = (slug) =>
  pub.get(`/marketplace/products/${slug}/`)

export const getMarketplaceVendors = (params) =>
  pub.get('/marketplace/vendors/', { params })

export const getMarketplaceVendor = (slug) =>
  pub.get(`/marketplace/vendors/${slug}/`)

export const getMarketplaceCategories = () =>
  pub.get('/marketplace/categories/')

export const searchMarketplace = (params) =>
  pub.get('/marketplace/search/', { params })

export const getFeaturedProducts = () =>
  pub.get('/marketplace/featured/')
