import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const key = (product_id, variant_id) => `${product_id}-${variant_id ?? 'x'}`

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const k        = key(item.product_id, item.variant_id)
        const existing = get().items.find((i) => key(i.product_id, i.variant_id) === k)
        if (existing) {
          set({
            items: get().items.map((i) =>
              key(i.product_id, i.variant_id) === k
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] })
        }
      },

      removeItem: (product_id, variant_id = null) => {
        const k = key(product_id, variant_id)
        set({ items: get().items.filter((i) => key(i.product_id, i.variant_id) !== k) })
      },

      updateQuantity: (product_id, variant_id, quantity) => {
        if (quantity < 1) { get().removeItem(product_id, variant_id); return }
        const k = key(product_id, variant_id)
        set({
          items: get().items.map((i) =>
            key(i.product_id, i.variant_id) === k ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      countItems: () => get().items.reduce((s, i) => s + i.quantity, 0),

      totalPrice: () => get().items.reduce((s, i) => s + i.unit_price * i.quantity, 0),

      byVendor: () => {
        const groups = {}
        for (const item of get().items) {
          if (!groups[item.vendor_id]) {
            groups[item.vendor_id] = {
              vendor_id:   item.vendor_id,
              vendor_name: item.vendor_name,
              vendor_slug: item.vendor_slug,
              items:       [],
            }
          }
          groups[item.vendor_id].items.push(item)
        }
        return Object.values(groups)
      },
    }),
    { name: 'naatalfi-cart' }
  )
)

export default useCartStore
