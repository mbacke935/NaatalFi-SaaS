import api from './api'

// Public
export const getCategories = () =>
  api.get('/categories/')

export const getCategoryBySlug = (slug) =>
  api.get(`/categories/${slug}/`)

// Admin
export const adminGetCategories = () =>
  api.get('/categories/admin/')

export const adminCreateCategory = (data) =>
  api.post('/categories/admin/', data)

export const adminUpdateCategory = (id, data) =>
  api.patch(`/categories/admin/${id}/`, data)

export const adminDeleteCategory = (id) =>
  api.delete(`/categories/admin/${id}/`)

export const adminUploadCategoryImage = (id, file) => {
  const form = new FormData()
  form.append('image', file)
  return api.post(`/categories/admin/${id}/image/`, form, {
    headers: { 'Content-Type': undefined },
  })
}

export const adminReorderCategories = (items) =>
  api.post('/categories/admin/reorder/', items)
