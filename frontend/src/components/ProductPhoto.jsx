import { useRef, useState } from 'react'

function ProductPhoto({ src, alt = '', className = '', fallback = 'IMG', preview = true }) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewStyle, setPreviewStyle] = useState({})
  const timerRef = useRef(null)
  const canPreview = Boolean(src && preview)

  const openPreview = (event) => {
    if (!canPreview) return
    window.clearTimeout(timerRef.current)
    const rect = event.currentTarget.getBoundingClientRect()
    const panelWidth = Math.min(420, window.innerWidth - 24)
    const panelHeight = Math.min(520, window.innerHeight - 24)
    const gap = 14
    const placeRight = rect.right + gap + panelWidth <= window.innerWidth
    const placeLeft = rect.left - gap - panelWidth >= 0
    const left = placeRight
      ? rect.right + gap
      : placeLeft
        ? rect.left - gap - panelWidth
        : Math.max(12, (window.innerWidth - panelWidth) / 2)
    const top = Math.min(
      Math.max(12, rect.top + rect.height / 2 - panelHeight / 2),
      window.innerHeight - panelHeight - 12,
    )
    setPreviewStyle({ left, top, width: panelWidth, height: panelHeight })
    timerRef.current = window.setTimeout(() => setShowPreview(true), 120)
  }

  const closePreview = () => {
    window.clearTimeout(timerRef.current)
    setShowPreview(false)
  }

  return (
    <div
      className={`product-image-frame ${className}`}
      onMouseEnter={openPreview}
      onMouseLeave={closePreview}
      onFocus={openPreview}
      onBlur={closePreview}
      tabIndex={canPreview ? 0 : undefined}
    >
      {src ? (
        <img src={src} alt={alt} className="product-image-natural" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs font-semibold">
          {fallback}
        </div>
      )}
      {canPreview && showPreview && (
        <div className="product-image-preview-popover" style={previewStyle} aria-hidden="true">
          <img src={src} alt="" className="product-image-preview-img" />
        </div>
      )}
    </div>
  )
}

export default ProductPhoto
