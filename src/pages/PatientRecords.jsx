import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as patientsApi from '../api/patients'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../context/AuthContext'
import VulnerabilityBanner from '../components/VulnerabilityBanner'

function StaffRecordsView() {
  const [search, setSearch] = useState('')

  const { data: patients, isLoading } = useQuery({
    queryKey: queryKeys.patients,
    queryFn: patientsApi.listPatients,
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
              {filtered?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                      #{p.id}
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

      {/* IDOR explanation for staff view */}
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
        <p className="font-semibold text-red-800 mb-1">⚠️ IDOR — Sequential IDs exposed</p>
        <p className="text-red-700">Patient IDs are sequential integers (1, 2, 3...). A logged-in attacker could loop through <span className="font-mono">/records/1</span> to <span className="font-mono">/records/99999</span> and harvest every patient record automatically. There is no server-side ownership check.</p>
        <div className="mt-2 bg-gray-900 rounded p-2 font-mono text-xs text-green-400">
          {`for patient_id in range(1, 99999):\n    r = requests.get(f"/records/{'{patient_id}'}", cookies=my_session)\n    steal(r.json())  # No check — always returns data`}
        </div>
      </div>
    </div>
  )
}

function PatientSelfView() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [idorId, setIdorId] = useState('')

  const { data: myPatient, isLoading } = useQuery({
    queryKey: queryKeys.patientSelf(session.user.id),
    queryFn: () => patientsApi.getPatientByUserId(session.user.id),
  })

  if (isLoading) return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
  if (!myPatient) return <p className="text-gray-400">No patient record found.</p>

  return (
    <div className="max-w-2xl space-y-6">
      {/* Own record */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Your Record ID: <strong>#{myPatient.id}</strong></span>
          <span className="text-xs text-gray-400">← this ID is sequential and predictable</span>
        </div>

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

      {/* IDOR Demo */}
      <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
        <p className="font-semibold text-red-800 text-sm mb-1">🔓 IDOR Exploit Demo — Access Any Patient Record</p>
        <p className="text-xs text-red-600 mb-4">
          You are logged in as <strong>{profile?.full_name}</strong> (Patient #{myPatient.id}). Enter a different patient ID below. The server performs <strong>no ownership check</strong> — it will navigate to that record and return it to you.
        </p>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-red-300 rounded-lg px-3 py-2 flex-1 font-mono text-sm">
            <span className="text-gray-400">GET /records/</span>
            <input
              type="number"
              value={idorId}
              onChange={e => setIdorId(e.target.value)}
              className="w-20 outline-none text-red-700 font-bold"
              placeholder="1"
              min="1"
            />
          </div>
          <button
            onClick={() => idorId && navigate(`/records/${idorId}`)}
            disabled={!idorId}
            className="btn-danger text-sm px-4"
          >
            Go to Record
          </button>
        </div>
        <p className="text-xs text-red-500 mt-2">
          Try any number — you'll land on <span className="font-mono">http://localhost:5173/records/{idorId || 'N'}</span> with full access to that patient's data.
        </p>
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

      <VulnerabilityBanner
        issue="2"
        title="IDOR — Sequential Patient IDs, No Ownership Check"
        description="Patient records are identified by sequential integers (1, 2, 3…). Any logged-in user can request any patient ID and the server returns the full record — no check is made to verify the record belongs to them."
        attacker="A logged-in patient can access any other patient's diagnosis, IC number, and medical history by incrementing the ID in the URL."
      />

      {profile?.role === 'patient' && <PatientSelfView />}
      {(profile?.role === 'doctor' || profile?.role === 'nurse' || profile?.role === 'admin') && <StaffRecordsView />}
    </div>
  )
}
