import { useState } from 'react'

function ProductPhoto({ src, alt = '', className = '', fallback = 'IMG', preview = true }) {
  const [showPreview, setShowPreview] = useState(false)
  const canPreview = Boolean(src && preview)

  return (
    <div
      className={`product-image-frame ${className}`}
      onMouseEnter={() => canPreview && setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      onFocus={() => canPreview && setShowPreview(true)}
      onBlur={() => setShowPreview(false)}
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
        <div className="product-image-preview" aria-hidden="true">
          <div className="product-image-preview-panel">
            <img src={src} alt="" className="product-image-preview-img" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductPhoto
