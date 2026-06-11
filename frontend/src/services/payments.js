import api from './api'

export const initiatePayment = (orderId, provider = 'PAYTECH') =>
  api.post('/payments/initiate/', { order_id: orderId, provider })

export const getPaymentStatus = (reference) =>
  api.get(`/payments/${reference}/`)
