import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as usersApi from '../api/users'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../context/AuthContext'
import RoleGuard from '../components/RoleGuard'

const ROLE_COLORS = {
  patient: 'bg-green-100 text-green-800',
  nurse: 'bg-purple-100 text-purple-800',
  doctor: 'bg-blue-100 text-blue-800',
  admin: 'bg-red-100 text-red-800',
}

function CreateStaffModal({ onClose, viewer }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'doctor', phone_number: '' })
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password || !form.role) {
      toast.error('Please fill in all required fields.')
      return
    }
    setLoading(true)

    try {
      const res = await usersApi.createStaffUser({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone_number: form.phone_number || null,
      }, viewer)
      if (res.error) throw new Error(res.details)
      toast.success('Staff account created.')
      qc.invalidateQueries({ queryKey: queryKeys.users })
      onClose()
    } catch {
      toast.error('Could not create account. The email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Create Staff Account</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Temporary Password *</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Phone <span className="text-gray-400">(optional)</span></label>
              <input className="input" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creating…' : 'Create Account'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const { session, profile } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const viewer = { role: profile?.role, userId: session?.user.id }

  const { data: profiles, isLoading } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const res = await usersApi.listUsers(viewer)
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  const { mutate: changeRole } = useMutation({
    mutationFn: async ({ id, role }) => {
      const res = await usersApi.updateUserRole(id, role, viewer)
      if (res.error) throw new Error(res.details)
      return res.data
    },
    onSuccess: () => {
      toast.success('Role updated')
      qc.invalidateQueries({ queryKey: queryKeys.users })
    },
    onError: (err) => toast.error(err?.message ?? 'Failed to update role.'),
  })

  const filtered = profiles?.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.role?.toLowerCase().includes(search.toLowerCase())
  )

  const roleCounts = profiles?.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})

  return (
    <RoleGuard allowed={['admin']}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Manage user accounts and roles.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ Add Staff</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {['patient', 'doctor', 'nurse', 'admin'].map(role => (
            <div key={role} className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{roleCounts?.[role] ?? 0}</p>
              <p className={`badge mx-auto mt-1 capitalize ${ROLE_COLORS[role]}`}>{role}s</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <input
            className="input max-w-xs"
            placeholder="Search by name or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered?.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.phone_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize ${ROLE_COLORS[p.role]}`}>{p.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.id !== session?.user.id && (
                        <select
                          value={p.role}
                          onChange={e => changeRole({ id: p.id, role: e.target.value })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="patient">Patient</option>
                          <option value="nurse">Nurse</option>
                          <option value="doctor">Doctor</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered?.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showCreate && <CreateStaffModal onClose={() => setShowCreate(false)} viewer={viewer} />}
      </div>
    </RoleGuard>
  )
}
