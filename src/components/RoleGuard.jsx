import { useAuth } from '../context/AuthContext'

export default function RoleGuard({ allowed, children }) {
  const { profile } = useAuth()

  if (!profile) return null

  if (!allowed.includes(profile.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500">
          Your role (<span className="font-semibold capitalize">{profile.role}</span>) does not have
          permission to view this page.
        </p>
      </div>
    )
  }

  return children
}
