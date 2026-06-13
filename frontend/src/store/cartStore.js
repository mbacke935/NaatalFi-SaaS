import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const key = (product_id, variant_id) => `${product_id}-${variant_id ?? 'x'}`

export const normalizeCartItems = (items = []) => {
  const merged = new Map()
  for (const item of items) {
    const k = key(item.product_id, item.variant_id)
    const qty = Number(item.quantity ?? 1)
    if (merged.has(k)) {
      const existing = merged.get(k)
      merged.set(k, { ...existing, quantity: existing.quantity + qty })
    } else {
      merged.set(k, { ...item, quantity: qty })
    }
  }
  return Array.from(merged.values())
}

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const qty      = item.quantity ?? 1
        const k        = key(item.product_id, item.variant_id)
        const items    = normalizeCartItems(get().items)
        const existing = items.find((i) => key(i.product_id, i.variant_id) === k)
        if (existing) {
          set({
            items: items.map((i) =>
              key(i.product_id, i.variant_id) === k
                ? { ...i, quantity: i.quantity + qty }
                : i
            ),
          })
        } else {
          set({ items: [...items, { ...item, quantity: qty }] })
        }
      },

      removeItem: (product_id, variant_id = null) => {
        const k = key(product_id, variant_id)
        set({ items: normalizeCartItems(get().items).filter((i) => key(i.product_id, i.variant_id) !== k) })
      },

      updateQuantity: (product_id, variant_id, quantity) => {
        if (quantity < 1) { get().removeItem(product_id, variant_id); return }
        const k = key(product_id, variant_id)
        set({
          items: normalizeCartItems(get().items).map((i) =>
            key(i.product_id, i.variant_id) === k ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      countItems: () => normalizeCartItems(get().items).reduce((s, i) => s + i.quantity, 0),

      totalPrice: () => normalizeCartItems(get().items).reduce((s, i) => s + i.unit_price * i.quantity, 0),

      byVendor: () => {
        const groups = {}
        for (const item of normalizeCartItems(get().items)) {
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
    {
      name: 'naatalfi-cart',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        items: normalizeCartItems(persistedState?.items ?? []),
      }),
    }
  )
)

export default useCartStore
