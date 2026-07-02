import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const updateSchema = z.object({
  home_address: z.string().max(300).optional().or(z.literal('')),
  medical_history: z.string().max(2000).optional().or(z.literal('')),
  diagnosis: z.string().max(1000).optional().or(z.literal('')),
})

function PatientDetail({ patient, onClose, canEdit }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      home_address: patient.home_address ?? '',
      medical_history: patient.medical_history ?? '',
      diagnosis: patient.diagnosis ?? '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('patients')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', patient.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Record updated')
      qc.invalidateQueries({ queryKey: ['patients'] })
      qc.invalidateQueries({ queryKey: ['patient-self'] })
      onClose()
    },
    onError: () => toast.error('Failed to update record.'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Patient Record</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-800">{patient.profiles?.full_name}</p>
            <p className="text-gray-500">DOB: {patient.date_of_birth ?? '—'}</p>
            <p className="text-gray-500">Phone: {patient.profiles?.phone_number ?? '—'}</p>
          </div>

          <form onSubmit={handleSubmit(mutate)} className="space-y-4">
            <div>
              <label className="label">Home Address</label>
              <input {...register('home_address')} className="input" disabled={!canEdit} />
              {errors.home_address && <p className="text-red-500 text-xs mt-1">{errors.home_address.message}</p>}
            </div>
            <div>
              <label className="label">Diagnosis</label>
              <textarea {...register('diagnosis')} rows={3} className="input" disabled={!canEdit} />
              {errors.diagnosis && <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>}
            </div>
            <div>
              <label className="label">Medical History</label>
              <textarea {...register('medical_history')} rows={4} className="input" disabled={!canEdit} />
              {errors.medical_history && <p className="text-red-500 text-xs mt-1">{errors.medical_history.message}</p>}
            </div>

            {canEdit && (
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
                  {isPending ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

function StaffRecordsView() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const { profile } = useAuth()

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, date_of_birth, profiles!profile_id(full_name, phone_number)')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const filtered = patients?.filter(p =>
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  async function loadFull(patientId) {
    const { data } = await supabase
      .from('patients')
      .select('id, date_of_birth, home_address, diagnosis, medical_history, profiles!profile_id(full_name, phone_number)')
      .eq('id', patientId)
      .single()
    setSelected(data)
  }

  const canEdit = profile?.role === 'doctor' || profile?.role === 'admin'

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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Patient Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date of Birth</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.profiles?.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.date_of_birth ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.profiles?.phone_number ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => loadFull(p.id)} className="text-brand-600 hover:underline text-xs font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered?.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <PatientDetail
          patient={selected}
          onClose={() => setSelected(null)}
          canEdit={canEdit}
        />
      )}
    </div>
  )
}

function PatientSelfView() {
  const { session } = useAuth()
  const [editing, setEditing] = useState(false)

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-self', session.user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, date_of_birth, home_address, diagnosis, medical_history, insurance_id, profiles!profile_id(full_name, phone_number)')
        .eq('profile_id', session.user.id)
        .single()
      return data
    },
  })

  if (isLoading) return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
  if (!patient) return <p className="text-gray-400">No patient record found.</p>

  return (
    <div className="max-w-2xl">
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Full Name</p>
            <p className="font-medium text-gray-800 mt-1">{patient.profiles?.full_name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Date of Birth</p>
            <p className="font-medium text-gray-800 mt-1">{patient.date_of_birth ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Phone Number</p>
            <p className="font-medium text-gray-800 mt-1">{patient.profiles?.phone_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Insurance ID</p>
            <p className="font-medium text-gray-800 mt-1">{patient.insurance_id ?? '—'}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div className="text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Home Address</p>
          <p className="text-gray-800">{patient.home_address || <span className="text-gray-400 italic">Not provided</span>}</p>
        </div>

        <div className="text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Diagnosis</p>
          <p className="text-gray-800">{patient.diagnosis || <span className="text-gray-400 italic">No active diagnosis</span>}</p>
        </div>

        <div className="text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Medical History</p>
          <p className="text-gray-800 whitespace-pre-wrap">{patient.medical_history || <span className="text-gray-400 italic">No history recorded</span>}</p>
        </div>
      </div>

      {editing && (
        <PatientDetail
          patient={patient}
          onClose={() => setEditing(false)}
          canEdit={false}
        />
      )}
    </div>
  )
}

export default function PatientRecords() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Records</h1>
      <p className="text-gray-500 text-sm mb-6">
        {profile?.role === 'patient' ? 'Your personal health record.' : 'View and manage all patient records.'}
      </p>

      {profile?.role === 'patient' && <PatientSelfView />}
      {(profile?.role === 'doctor' || profile?.role === 'nurse' || profile?.role === 'admin') && <StaffRecordsView />}
    </div>
  )
}
