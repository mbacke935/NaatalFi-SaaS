import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ComingSoon from './ComingSoon'

describe('ComingSoon', () => {
  it('affiche le titre par défaut et le badge', () => {
    render(<ComingSoon />)
    // Le titre par défaut et le badge contiennent tous deux ce texte.
    expect(screen.getAllByText('Bientôt disponible').length).toBeGreaterThanOrEqual(1)
  })

  it('affiche un titre personnalisé', () => {
    render(<ComingSoon title="Publicités sponsorisées" />)
    expect(screen.getByText('Publicités sponsorisées')).toBeInTheDocument()
  })

  it('affiche la description quand elle est fournie', () => {
    render(<ComingSoon title="Favoris" description="Cette fonctionnalité arrive bientôt." />)
    expect(screen.getByText('Cette fonctionnalité arrive bientôt.')).toBeInTheDocument()
  })

  it("n'affiche pas de paragraphe de description sans prop", () => {
    const { container } = render(<ComingSoon title="Avis" />)
    expect(container.querySelector('p')).toBeNull()
  })
})
