import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import * as patientsApi from '../api/patients'
import { useAuth } from '../context/AuthContext'

const updateSchema = z.object({
  home_address: z.string().max(300).optional().or(z.literal('')),
  medical_history: z.string().max(2000).optional().or(z.literal('')),
  diagnosis: z.string().max(1000).optional().or(z.literal('')),
})

export default function PatientRecordDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { profile, session } = useAuth()

  const { data: myPatient } = useQuery({
    queryKey: ['patient-self-id', session?.user.id],
    enabled: profile?.role === 'patient',
    queryFn: async () => {
      const res = await patientsApi.getPatientIdByUserId(session.user.id)
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  const isPatient = profile?.role === 'patient'

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient-detail', id],
    enabled: !!profile && (!isPatient || !!myPatient),
    queryFn: async () => {
      const viewer = { role: profile.role, userId: session.user.id, patientId: myPatient?.id }
      const res = await patientsApi.getPatientById(id, viewer)
      if (res.error) throw new Error(res.details)
      return res.data
    },
    retry: false,
  })

  const canEdit = profile?.role === 'doctor' || profile?.role === 'admin'

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(updateSchema),
    values: {
      home_address: patient?.home_address ?? '',
      medical_history: patient?.medical_history ?? '',
      diagnosis: patient?.diagnosis ?? '',
    },
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (data) => {
      const viewer = { role: profile.role, userId: session.user.id }
      const res = await patientsApi.updatePatientRecord(id, data, viewer)
      if (res.error) throw new Error(res.details)
      return res.data
    },
    onSuccess: () => {
      toast.success('Record updated')
      qc.invalidateQueries({ queryKey: ['patient-detail', id] })
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
    onError: (err) => toast.error(err?.message ?? 'Failed to update record.'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="max-w-2xl">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-semibold text-red-800 mb-1">Patient record not found</p>
          <p className="text-sm text-red-600 font-mono">{error?.message ?? 'No data returned'}</p>
          <Link to="/records" className="btn-secondary mt-4 inline-flex">← Back to Records</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/records" className="hover:text-brand-600">Patient Records</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">
          {patient.users?.full_name ?? `Patient #${id}`}
        </span>
      </div>

      {/* Patient info header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{patient.users?.full_name}</h1>
              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                #{patient.id}
              </span>
            </div>
          </div>
          <Link to="/records" className="btn-secondary text-sm">← Back</Link>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-gray-100">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Date of Birth</p>
            <p className="font-medium text-gray-800 mt-1">{patient.date_of_birth ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Phone Number</p>
            <p className="font-medium text-gray-800 mt-1">{patient.users?.phone_number ?? '—'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(save)} className="space-y-4 pt-4">
          <div>
            <label className="label">Home Address</label>
            <input {...register('home_address')} className="input" disabled={!canEdit} placeholder="Not provided" />
            {errors.home_address && <p className="text-red-500 text-xs mt-1">{errors.home_address.message}</p>}
          </div>

          <div>
            <label className="label">Diagnosis</label>
            <textarea {...register('diagnosis')} rows={3} className="input" disabled={!canEdit} placeholder="No active diagnosis" />
            {errors.diagnosis && <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>}
          </div>

          <div>
            <label className="label">Medical History</label>
            <textarea {...register('medical_history')} rows={5} className="input" disabled={!canEdit} placeholder="No history recorded" />
            {errors.medical_history && <p className="text-red-500 text-xs mt-1">{errors.medical_history.message}</p>}
          </div>

          {canEdit && (
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => reset()} className="btn-secondary">Reset</button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
