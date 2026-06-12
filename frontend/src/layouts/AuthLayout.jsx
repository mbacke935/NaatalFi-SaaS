import { Outlet, Link } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center px-3 sm:px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold text-[#D4AF37] tracking-wide">NaatalFi</span>
          </Link>
          <p className="text-gray-400 text-sm mt-1">La marketplace sénégalaise</p>
        </div>
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-2xl p-5 sm:p-8 shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
