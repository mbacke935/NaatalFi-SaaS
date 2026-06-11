import api from './api'

export const createVendor = (data) =>
  api.post('/vendors/', data)

export const getMyVendor = () =>
  api.get('/vendors/me/')

export const updateMyVendor = (data) =>
  api.patch('/vendors/me/', data)

export const uploadLogo = (file) => {
  const form = new FormData()
  form.append('logo', file)
  return api.post('/vendors/me/logo/', form, {
    headers: { 'Content-Type': undefined },
  })
}

// Admin
export const adminGetVendors = (statusFilter = '') =>
  api.get('/vendors/admin/', { params: statusFilter ? { status: statusFilter } : {} })

export const adminGetVendor = (id) =>
  api.get(`/vendors/admin/${id}/`)

export const adminApproveVendor = (id) =>
  api.patch(`/vendors/admin/${id}/approve/`)

export const adminSuspendVendor = (id, reason = '') =>
  api.patch(`/vendors/admin/${id}/suspend/`, { reason })
