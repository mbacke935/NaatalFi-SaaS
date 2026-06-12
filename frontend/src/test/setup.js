import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Nettoyage du DOM après chaque test.
afterEach(() => {
  cleanup()
})

// localStorage en mémoire, fiable sous jsdom (utilisé par zustand/persist).
class MemoryStorage {
  constructor() { this.store = {} }
  getItem(k) { return k in this.store ? this.store[k] : null }
  setItem(k, v) { this.store[k] = String(v) }
  removeItem(k) { delete this.store[k] }
  clear() { this.store = {} }
  key(i) { return Object.keys(this.store)[i] ?? null }
  get length() { return Object.keys(this.store).length }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
})
