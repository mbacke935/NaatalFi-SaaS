import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiStar } from 'react-icons/fi'
import { getMyReviews } from '../../services/reviews'
import { useMeta } from '../../hooks/useMeta'

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5 text-[#D4AF37]">
      {Array.from({ length: 5 }).map((_, index) => (
        <FiStar key={index} size={14} fill={index < value ? 'currentColor' : 'none'} />
      ))}
    </div>
  )
}

function AccountReviewsPage() {
  useMeta({ title: 'Mes avis' })
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyReviews()
      .then(({ data }) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Mes avis</h1>

      {reviews.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-8 sm:p-10 text-center">
          <FiStar className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucun avis publie pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <Link to={`/marketplace/${review.product_slug}`} className="text-white font-semibold hover:text-[#D4AF37]">
                    {review.product_name}
                  </Link>
                  <p className="text-xs text-gray-500">{review.vendor_name}</p>
                </div>
                <Stars value={review.rating} />
              </div>
              {review.comment && <p className="text-sm text-gray-400">{review.comment}</p>}
              <p className="text-xs text-gray-600 mt-3">
                {new Date(review.created_at).toLocaleDateString('fr-FR')}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default AccountReviewsPage
