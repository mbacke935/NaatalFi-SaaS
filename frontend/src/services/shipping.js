import api from './api'

export const SENEGAL_REGIONS = [
  'Dakar', 'Thiès', 'Diourbel', 'Fatick', 'Kaolack', 'Kaffrine',
  'Kolda', 'Louga', 'Matam', 'Saint-Louis', 'Sédhiou',
  'Tambacounda', 'Ziguinchor', 'Kédougou',
]

export const getShippingZones  = ()        => api.get('/shipping/zones/')
export const createShippingZone = (data)   => api.post('/shipping/zones/', data)
export const updateShippingZone = (id, data) => api.patch(`/shipping/zones/${id}/`, data)
export const deleteShippingZone = (id)     => api.delete(`/shipping/zones/${id}/`)
export const estimateShipping   = (data)   => api.post('/shipping/estimate/', data)
