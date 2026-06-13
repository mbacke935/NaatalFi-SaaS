import { beforeEach, describe, expect, it } from 'vitest'
import useCartStore, { normalizeCartItems } from './cartStore'

const productA = {
  product_id: 1, variant_id: null, unit_price: 1000,
  vendor_id: 10, vendor_name: 'Boutique A', vendor_slug: 'boutique-a',
}
const productAVariant = { ...productA, variant_id: 5 }
const productB = {
  product_id: 2, variant_id: null, unit_price: 2500,
  vendor_id: 20, vendor_name: 'Boutique B', vendor_slug: 'boutique-b',
}

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
  })

  it('ajoute un article avec une quantité par défaut de 1', () => {
    useCartStore.getState().addItem(productA)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(1)
  })

  it('incrémente la quantité quand le même article (même variante) est rajouté', () => {
    useCartStore.getState().addItem(productA)
    useCartStore.getState().addItem({ ...productA, quantity: 2 })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('fusionne les doublons deja presents dans le panier persistant', () => {
    const items = normalizeCartItems([
      { ...productA, quantity: 1 },
      { ...productA, quantity: 2 },
      { ...productAVariant, quantity: 1 },
    ])

    expect(items).toHaveLength(2)
    expect(items.find((item) => item.variant_id === null).quantity).toBe(3)
    expect(items.find((item) => item.variant_id === 5).quantity).toBe(1)
  })

  it('remplace la quantite quand la fiche produit definit une quantite exacte', () => {
    useCartStore.getState().addItem({ ...productA, quantity: 1 })
    useCartStore.getState().setItem({ ...productA, quantity: 1 })
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(1)

    useCartStore.getState().setItem({ ...productA, quantity: 3 })
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })

  it('traite deux variantes du même produit comme des lignes distinctes', () => {
    useCartStore.getState().addItem(productA)
    useCartStore.getState().addItem(productAVariant)
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('met à jour la quantité et supprime la ligne si elle tombe sous 1', () => {
    useCartStore.getState().addItem(productA)
    useCartStore.getState().updateQuantity(1, null, 4)
    expect(useCartStore.getState().items[0].quantity).toBe(4)

    useCartStore.getState().updateQuantity(1, null, 0)
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('supprime un article ciblé par variante', () => {
    useCartStore.getState().addItem(productA)
    useCartStore.getState().addItem(productAVariant)
    useCartStore.getState().removeItem(1, 5)
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].variant_id).toBeNull()
  })

  it('calcule le total et le nombre d’articles', () => {
    useCartStore.getState().addItem({ ...productA, quantity: 2 }) // 2 × 1000
    useCartStore.getState().addItem(productB)                     // 1 × 2500
    expect(useCartStore.getState().countItems()).toBe(3)
    expect(useCartStore.getState().totalPrice()).toBe(4500)
  })

  it('regroupe les articles par vendeur', () => {
    useCartStore.getState().addItem(productA)
    useCartStore.getState().addItem(productB)
    const groups = useCartStore.getState().byVendor()
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.vendor_id).sort()).toEqual([10, 20])
  })

  it('vide entièrement le panier', () => {
    useCartStore.getState().addItem(productA)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
