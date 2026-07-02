import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', roles: ['patient', 'nurse', 'doctor', 'admin'] },
  { to: '/records', label: 'Patient Records', icon: '📋', roles: ['patient', 'nurse', 'doctor', 'admin'] },
  { to: '/appointments', label: 'Appointments', icon: '📅', roles: ['patient', 'nurse', 'doctor', 'admin'] },
  { to: '/prescriptions', label: 'Prescriptions', icon: '💊', roles: ['patient', 'doctor', 'admin'] },
  { to: '/admin', label: 'Admin Panel', icon: '⚙️', roles: ['admin'] },
]

export default function Sidebar() {
  const { profile } = useAuth()

  const visible = NAV_ITEMS.filter(item => profile && item.roles.includes(profile.role))

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 min-h-[calc(100vh-57px)]">
      <nav className="p-4 space-y-1">
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
