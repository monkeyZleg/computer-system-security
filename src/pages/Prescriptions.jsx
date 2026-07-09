import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import * as patientsApi from '../api/patients'
import * as prescriptionsApi from '../api/prescriptions'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../context/AuthContext'

const prescribeSchema = z.object({
  patient_search: z.string().min(1, 'Search and select a patient'),
  patient_id: z.string().uuid('Please select a patient from the list'),
  medication: z.string().min(2, 'Medication name required').max(200),
  dosage: z.string().min(1, 'Dosage required').max(200),
  issue_date: z.string().min(1, 'Issue date required'),
})

function IssueModal({ doctorId, onClose }) {
  const qc = useQueryClient()
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(prescribeSchema),
    defaultValues: { issue_date: new Date().toISOString().split('T')[0] },
  })

  async function searchPatients(query) {
    if (!query || query.length < 2) return
    const res = await patientsApi.searchPatientsByName(query)
    if (res.error) {
      toast.error('Search failed.')
      setPatientResults([])
      return
    }
    setPatientResults(res.data ?? [])
  }

  function pickPatient(p) {
    setSelectedPatient(p)
    setValue('patient_id', p.id)
    setValue('patient_search', p.users?.full_name)
    setPatientResults([])
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await prescriptionsApi.issuePrescription({
        patient_id: data.patient_id,
        doctor_id: doctorId,
        medication: data.medication,
        dosage: data.dosage,
        issue_date: data.issue_date,
      })
      if (res.error) throw new Error(res.details)
      return res.data
    },
    onSuccess: () => {
      toast.success('Prescription issued!')
      qc.invalidateQueries({ queryKey: ['prescriptions'] })
      onClose()
    },
    onError: () => toast.error('Failed to issue prescription.'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Issue Prescription</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
          <form onSubmit={handleSubmit(mutate)} className="space-y-4">
            <input type="hidden" {...register('patient_id')} />
            <div className="relative">
              <label className="label">Patient</label>
              <input
                {...register('patient_search')}
                className="input"
                placeholder="Type patient name…"
                onChange={e => {
                  setValue('patient_search', e.target.value)
                  searchPatients(e.target.value)
                }}
                autoComplete="off"
              />
              {errors.patient_id && <p className="text-red-500 text-xs mt-1">{errors.patient_id.message}</p>}
              {patientResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  {patientResults.map(p => (
                    <li key={p.id} onClick={() => pickPatient(p)} className="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer text-gray-800">
                      {p.users?.full_name}
                    </li>
                  ))}
                </ul>
              )}
              {selectedPatient && (
                <p className="text-xs text-green-600 mt-1">✓ Selected: {selectedPatient.users?.full_name}</p>
              )}
            </div>
            <div>
              <label className="label">Medication</label>
              <input {...register('medication')} className="input" placeholder="e.g. Amoxicillin 500mg" />
              {errors.medication && <p className="text-red-500 text-xs mt-1">{errors.medication.message}</p>}
            </div>
            <div>
              <label className="label">Dosage & Instructions</label>
              <input {...register('dosage')} className="input" placeholder="e.g. 1 tablet 3x daily for 7 days" />
              {errors.dosage && <p className="text-red-500 text-xs mt-1">{errors.dosage.message}</p>}
            </div>
            <div>
              <label className="label">Issue Date</label>
              <input {...register('issue_date')} type="date" className="input" max={new Date().toISOString().split('T')[0]} />
              {errors.issue_date && <p className="text-red-500 text-xs mt-1">{errors.issue_date.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isPending} className="btn-primary flex-1">
                {isPending ? 'Issuing…' : 'Issue Prescription'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Prescriptions() {
  const { profile, session } = useAuth()
  const [showIssue, setShowIssue] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const isPatient = profile?.role === 'patient'
  const isDoctor = profile?.role === 'doctor'

  const { data: patientRecord } = useQuery({
    queryKey: queryKeys.patientSelfId(session?.user.id),
    enabled: isPatient,
    queryFn: async () => {
      const res = await patientsApi.getPatientIdByUserId(session.user.id)
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: queryKeys.prescriptions(profile?.role, session?.user.id),
    enabled: !!profile,
    queryFn: async () => {
      const res = await prescriptionsApi.listPrescriptions({
        role: profile.role,
        userId: session.user.id,
        patientId: patientRecord?.id,
      })
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isPatient ? 'Your active and past prescriptions.' : 'Issue and manage prescriptions.'}
          </p>
        </div>
        {isDoctor && (
          <button onClick={() => setShowIssue(true)} className="btn-primary">
            + Issue Prescription
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {prescriptions?.map(rx => (
              <div key={rx.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">RX-{rx.id}</span>
                    </div>
                    <p className="font-semibold text-gray-800">{rx.medication}</p>
                    {!isPatient && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Patient: {rx.patients?.users?.full_name ?? '—'}
                      </p>
                    )}
                  </div>
                  <span className="badge bg-green-100 text-green-800 text-xs">{rx.issue_date}</span>
                </div>
                <p className="text-sm text-gray-600">{rx.dosage}</p>
                <p className="text-xs text-gray-400 mt-2">Issued by Dr. {rx.users?.full_name ?? '—'}</p>
              </div>
            ))}
            {prescriptions?.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">No prescriptions found.</div>
            )}
          </div>

          {/* Raw API response panel */}
          <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-5">
            <button
              onClick={() => setShowRaw(v => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold text-yellow-800"
            >
              <span>🔍 Raw API Response — What the server actually returns (DevTools view)</span>
              <span className="text-yellow-600">{showRaw ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {showRaw && (
              <div className="mt-4">
                <p className="text-xs text-yellow-700 mb-2">
                  Every field in the response below is sent to the browser — including <span className="font-mono font-bold">patient_id</span> and <span className="font-mono font-bold">doctor_id</span> which an attacker uses for further IDOR enumeration. A secure API would return ONLY <span className="font-mono">medication</span> and <span className="font-mono">dosage</span>.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="text-xs font-mono leading-5">
                    {prescriptions?.map((rx, i) => (
                      <span key={rx.id}>
                        <span className="text-gray-400">{i === 0 ? '[' : ''}{'\n'}  {'{'}</span>{'\n'}
                        <span className="text-yellow-400">    "id"</span><span className="text-gray-400">: </span><span className="text-orange-400 font-bold">{rx.id},  </span><span className="text-gray-500">// ← sequential int — use for IDOR enumeration</span>{'\n'}
                        <span className="text-yellow-400">    "medication"</span><span className="text-gray-400">: </span><span className="text-green-400">"{rx.medication}",</span>{'\n'}
                        <span className="text-yellow-400">    "dosage"</span><span className="text-gray-400">: </span><span className="text-green-400">"{rx.dosage}",</span>{'\n'}
                        <span className="text-yellow-400">    "issue_date"</span><span className="text-gray-400">: </span><span className="text-green-400">"{rx.issue_date}",</span>{'\n'}
                        <span className="text-red-400">    "patient_id"</span><span className="text-gray-400">: </span><span className="text-red-300 font-bold">{JSON.stringify(rx.patients?.id ?? rx.patient_id ?? '?')},  </span><span className="text-gray-500">// ← leaked! attacker queries patient #{rx.patients?.id}</span>{'\n'}
                        <span className="text-red-400">    "doctor_id"</span><span className="text-gray-400">: </span><span className="text-red-300 font-bold">"{rx.users?.id ?? 'uuid...'}",  </span><span className="text-gray-500">// ← leaked! attacker impersonates doctor</span>{'\n'}
                        <span className="text-gray-400">  {'}'}{i < (prescriptions?.length ?? 0) - 1 ? ',' : '\n]'}</span>{'\n'}
                      </span>
                    ))}
                    {(!prescriptions || prescriptions.length === 0) && <span className="text-gray-400">[]</span>}
                  </pre>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  <strong>Fix:</strong> Use <span className="font-mono">SELECT medication, dosage, issue_date FROM prescriptions</span> — never <span className="font-mono">SELECT *</span>.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {showIssue && (
        <IssueModal doctorId={session.user.id} onClose={() => setShowIssue(false)} />
      )}
    </div>
  )
}
