import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiHeart, FiTrash2 } from 'react-icons/fi'
import { getFavorites, removeFavorite } from '../../services/account'
import { useMeta }                      from '../../hooks/useMeta'
import ProductPhoto from '../../components/ProductPhoto'

function AccountFavoritesPage() {
  useMeta({ title: 'Mes favoris' })

  const [favorites, setFavorites] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    getFavorites()
      .then(({ data }) => setFavorites(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (productId) => {
    try {
      await removeFavorite(productId)
      setFavorites((prev) => prev.filter((f) => f.product.id !== productId))
      toast.success('Retiré des favoris.')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        Mes favoris
        {!loading && favorites.length > 0 && (
          <span className="ml-2 text-base text-gray-500 font-normal">({favorites.length})</span>
        )}
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-8 sm:p-16 text-center">
          <FiHeart size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Vous n'avez pas encore de favoris.</p>
          <Link to="/marketplace" className="text-[#D4AF37] hover:underline text-sm">
            Découvrir la marketplace →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {favorites.map(({ id, product }) => {
            const cover = product.images?.[0]?.image_url ?? product.cover_image ?? null
            return (
              <div key={id}
                className="group bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all hover:-translate-y-0.5 relative"
              >
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition text-red-400 hover:text-red-300"
                  title="Retirer des favoris"
                >
                  <FiTrash2 size={13} />
                </button>

                <Link to={`/marketplace/${product.slug}`}>
                  <ProductPhoto src={cover} alt={product.name} className="aspect-[4/3]" fallback="IMG" />
                  <div className="hidden">
                    {cover
                      ? <div className="product-image-bg" role="img" aria-label={product.name} style={{ backgroundImage: `url("${cover}")` }} />
                      : <div className="w-full h-full flex items-center justify-center text-gray-700 text-3xl">📦</div>
                    }
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-medium line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-[#D4AF37] text-sm font-bold">
                      {Number(product.price).toLocaleString('fr-SN')} FCFA
                    </p>
                    {product.vendor_name && (
                      <p className="text-gray-600 text-xs mt-0.5 truncate">{product.vendor_name}</p>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AccountFavoritesPage
