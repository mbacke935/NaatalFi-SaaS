function ProductPhoto({ src, alt = '', className = '', fallback = 'IMG' }) {
  return (
    <div className={`product-image-frame ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="product-image-natural" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs font-semibold">
          {fallback}
        </div>
      )}
    </div>
  )
}

export default ProductPhoto
