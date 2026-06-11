import { useRef, useState } from 'react'
import { FiUpload, FiX } from 'react-icons/fi'

function ImageUpload({ currentUrl, onFile, label = 'Choisir une image', accept = 'image/jpeg,image/png,image/webp' }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(currentUrl || null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    onFile(file)
  }

  const handleChange = (e) => handleFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleRemove = () => {
    setPreview(null)
    onFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="Aperçu"
            className="w-32 h-32 object-cover rounded-xl border border-[#2a2a3a]"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5"
          >
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-32 h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition
            ${dragging ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#2a2a3a] hover:border-[#D4AF37]'}`}
        >
          <FiUpload className="text-gray-500 mb-1" size={20} />
          <span className="text-gray-500 text-xs text-center px-2">{label}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-xs text-gray-600">JPG, PNG, WebP — max 5 Mo</p>
    </div>
  )
}

export default ImageUpload
