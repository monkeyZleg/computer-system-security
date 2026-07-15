import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as patientsApi from '../api/patients'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../context/AuthContext'
import { seqId } from '../lib/displayId'

function StaffRecordsView() {
  const [search, setSearch] = useState('')
  const { profile } = useAuth()

  const { data: patients, isLoading } = useQuery({
    queryKey: queryKeys.patients,
    queryFn: async () => {
      const res = await patientsApi.listPatients({ role: profile.role })
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  const filtered = patients?.filter(p =>
    p.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by patient name…"
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Patient Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date of Birth</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                      #{seqId(i)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.users?.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.date_of_birth ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.users?.phone_number ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/records/${p.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PatientSelfView() {
  const { session } = useAuth()
  const { data: myPatient, isLoading } = useQuery({
    queryKey: queryKeys.patientSelf(session.user.id),
    queryFn: async () => {
      const res = await patientsApi.getPatientByUserId(session.user.id)
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  if (isLoading) return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
  if (!myPatient) return <p className="text-gray-400">No patient record found.</p>

  return (
    <div className="max-w-2xl space-y-6">
      {/* Own record */}
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Full Name</p>
            <p className="font-medium text-gray-800 mt-1">{myPatient.users?.full_name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Date of Birth</p>
            <p className="font-medium text-gray-800 mt-1">{myPatient.date_of_birth ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Phone Number</p>
            <p className="font-medium text-gray-800 mt-1">{myPatient.users?.phone_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Insurance ID</p>
            <p className="font-medium text-gray-800 mt-1">{myPatient.insurance_id ?? '—'}</p>
          </div>
        </div>
        <hr className="border-gray-100" />
        <div className="text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Diagnosis</p>
          <p className="text-gray-800">{myPatient.diagnosis || <span className="text-gray-400 italic">No active diagnosis</span>}</p>
        </div>
        <div className="text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Medical History</p>
          <p className="text-gray-800 whitespace-pre-wrap">{myPatient.medical_history || <span className="text-gray-400 italic">No history recorded</span>}</p>
        </div>

        <Link to={`/records/${myPatient.id}`} className="btn-secondary inline-flex text-sm">
          View Full Record →
        </Link>
      </div>
    </div>
  )
}

export default function PatientRecords() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Records</h1>
      <p className="text-gray-500 text-sm mb-4">
        {profile?.role === 'patient' ? 'Your personal health record.' : 'View and manage all patient records.'}
      </p>

      {profile?.role === 'patient' && <PatientSelfView />}
      {(profile?.role === 'doctor' || profile?.role === 'nurse' || profile?.role === 'admin') && <StaffRecordsView />}
    </div>
  )
}
