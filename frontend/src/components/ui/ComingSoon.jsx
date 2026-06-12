import { FiClock } from 'react-icons/fi'

function ComingSoon({ title = 'Bientôt disponible', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-6">
        <FiClock size={28} className="text-[#D4AF37]" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      {description && (
        <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">{description}</p>
      )}
      <span className="mt-6 inline-flex items-center px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium border border-[#D4AF37]/20">
        Bientôt disponible
      </span>
    </div>
  )
}

export default ComingSoon
