import api from './api'

// ── Public ────────────────────────────────────────────────────────────
export const getProducts = (params) =>
  api.get('/products/', { params })

export const getProductBySlug = (slug) =>
  api.get(`/products/${slug}/`)

// ── Vendor — produits ─────────────────────────────────────────────────
export const getMyProducts = (params) =>
  api.get('/vendors/me/products/', { params })

export const getMyProduct = (id) =>
  api.get(`/vendors/me/products/${id}/`)

export const createProduct = (data) =>
  api.post('/vendors/me/products/', data)

export const updateProduct = (id, data) =>
  api.patch(`/vendors/me/products/${id}/`, data)

export const deleteProduct = (id) =>
  api.delete(`/vendors/me/products/${id}/`)

// ── Vendor — images ───────────────────────────────────────────────────
export const uploadProductImage = (productId, file) => {
  const form = new FormData()
  form.append('image', file)
  return api.post(`/vendors/me/products/${productId}/images/`, form, {
    headers: { 'Content-Type': undefined },
  })
}

export const deleteProductImage = (productId, imageId) =>
  api.delete(`/vendors/me/products/${productId}/images/${imageId}/`)

export const setProductImageCover = (productId, imageId) =>
  api.patch(`/vendors/me/products/${productId}/images/${imageId}/cover/`)

export const reorderProductImages = (productId, items) =>
  api.post(`/vendors/me/products/${productId}/images/reorder/`, items)

// ── Vendor — variantes ────────────────────────────────────────────────
export const getMyProductVariants = (productId) =>
  api.get(`/vendors/me/products/${productId}/variants/`)

export const createVariant = (productId, data) =>
  api.post(`/vendors/me/products/${productId}/variants/`, data)

export const updateVariant = (productId, variantId, data) =>
  api.patch(`/vendors/me/products/${productId}/variants/${variantId}/`, data)

export const deleteVariant = (productId, variantId) =>
  api.delete(`/vendors/me/products/${productId}/variants/${variantId}/`)
