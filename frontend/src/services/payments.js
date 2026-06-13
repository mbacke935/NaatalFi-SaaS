import api from './api'

export const initiatePayment = (orderId, provider = 'PAYTECH', accessToken = '') =>
  api.post('/payments/initiate/', { order_id: orderId, provider, access_token: accessToken })

export const getPaymentStatus = (reference, token = '') =>
  api.get(`/payments/${reference}/`, {
    headers: token ? { 'X-Guest-Token': token } : {},
  })
