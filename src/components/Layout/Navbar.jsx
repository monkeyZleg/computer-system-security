import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const ROLE_COLORS = {
  patient: 'bg-green-100 text-green-800',
  nurse: 'bg-purple-100 text-purple-800',
  doctor: 'bg-blue-100 text-blue-800',
  admin: 'bg-red-100 text-red-800',
}

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">H</span>
        </div>
        <span className="font-semibold text-gray-800 text-lg">HPMS</span>
        <span className="hidden sm:block text-gray-400 text-sm">Healthcare Patient Management</span>
      </div>

      {profile && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{profile.full_name}</p>
            <span className={`badge ${ROLE_COLORS[profile.role]} capitalize`}>{profile.role}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
