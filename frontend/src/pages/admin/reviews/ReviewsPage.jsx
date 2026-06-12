import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiStar, FiTrash2 } from 'react-icons/fi'
import { deleteAdminReview, getAdminReviews } from '../../../services/admin'

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5 text-[#D4AF37]">
      {Array.from({ length: 5 }).map((_, index) => (
        <FiStar key={index} size={14} fill={index < value ? 'currentColor' : 'none'} />
      ))}
    </div>
  )
}

function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadReviews = () => {
    setLoading(true)
    getAdminReviews()
      .then(({ data }) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Impossible de charger les avis.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const handleDelete = async (review) => {
    try {
      await deleteAdminReview(review.id)
      setReviews((items) => items.filter((item) => item.id !== review.id))
      setConfirmDelete(null)
      toast.success('Avis supprimé.')
    } catch {
      toast.error('Suppression impossible.')
    }
  }

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Avis</h1>
        <p className="text-sm text-gray-500 mt-1">Moderation des avis clients verifies.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiStar size={36} className="text-gray-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          {reviews.map((review) => (
            <article key={review.id} className="flex items-start gap-4 p-4 border-b border-[#2a2a3a] last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <p className="text-white font-semibold">{review.product_name}</p>
                  <Stars value={review.rating} />
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {review.vendor_name} · {review.author_name} · {new Date(review.created_at).toLocaleDateString('fr-FR')}
                </p>
                {review.comment && <p className="text-sm text-gray-400">{review.comment}</p>}
              </div>
              <button
                type="button"
                onClick={() => setConfirmDelete(review)}
                className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
                aria-label="Supprimer"
              >
                <FiTrash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold mb-2">Supprimer cet avis ?</h3>
            <p className="text-gray-400 text-sm mb-5">L'avis de <span className="text-white">{confirmDelete.author_name}</span> sur <span className="text-white">{confirmDelete.product_name}</span> sera définitivement supprimé.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-[#2a2a3a] text-gray-400 hover:text-white rounded-lg text-sm transition">Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewsPage
