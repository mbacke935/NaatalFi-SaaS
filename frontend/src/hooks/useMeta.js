import { useEffect } from 'react'

export function useMeta({ title, description, image } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | NaatalFi` : 'NaatalFi — Marketplace sénégalaise'
    document.title = fullTitle

    const setMeta = (attr, attrValue, content) => {
      let el = document.querySelector(`meta[${attr}="${attrValue}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, attrValue)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
    }
    setMeta('property', 'og:title', fullTitle)
    if (image) setMeta('property', 'og:image', image)
    setMeta('property', 'og:type', 'website')
  }, [title, description, image])
}
