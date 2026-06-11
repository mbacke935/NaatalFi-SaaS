import { FiStar } from 'react-icons/fi'

function ReviewsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Avis</h1>
        <p className="text-sm text-gray-500 mt-1">Moderation des avis clients.</p>
      </div>

      <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
        <FiStar size={36} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-white font-semibold mb-2">Module avis a venir</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          La moderation sera connectee quand le module avis et trust score sera implemente en phase 15.
        </p>
      </div>
    </div>
  )
}

export default ReviewsPage
