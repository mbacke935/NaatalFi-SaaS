import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { useMeta } from './useMeta'

function Probe({ title, description }) {
  useMeta({ title, description })
  return null
}

describe('useMeta', () => {
  it('définit le titre du document avec le suffixe NaatalFi', () => {
    render(<Probe title="Mon panier" />)
    expect(document.title).toBe('Mon panier | NaatalFi')
  })

  it('utilise le titre par défaut sans prop title', () => {
    render(<Probe />)
    expect(document.title).toBe('NaatalFi — Marketplace sénégalaise')
  })

  it('pose les meta og:title et description', () => {
    render(<Probe title="Produit X" description="Une description produit." />)
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const desc = document.querySelector('meta[name="description"]')
    expect(ogTitle?.getAttribute('content')).toBe('Produit X | NaatalFi')
    expect(desc?.getAttribute('content')).toBe('Une description produit.')
  })
})
