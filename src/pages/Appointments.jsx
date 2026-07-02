import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const bookSchema = z.object({
  doctor_id: z.string().uuid('Please select a doctor'),
  appointment_date: z.string().min(1, 'Please select a date and time'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function BookModal({ patientId, onClose }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(bookSchema),
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['doctor'])
        .order('full_name')
      return data ?? []
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        doctor_id: data.doctor_id,
        appointment_date: new Date(data.appointment_date).toISOString(),
        notes: data.notes || null,
        status: 'scheduled',
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Appointment booked!')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      onClose()
    },
    onError: () => toast.error('Failed to book appointment.'),
  })

  const minDate = new Date()
  minDate.setHours(minDate.getHours() + 1)
  const minStr = minDate.toISOString().slice(0, 16)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Book Appointment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          <form onSubmit={handleSubmit(mutate)} className="space-y-4">
            <div>
              <label className="label">Select Doctor</label>
              <select {...register('doctor_id')} className="input">
                <option value="">— Choose a doctor —</option>
                {doctors?.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
              {errors.doctor_id && <p className="text-red-500 text-xs mt-1">{errors.doctor_id.message}</p>}
            </div>

            <div>
              <label className="label">Date & Time</label>
              <input {...register('appointment_date')} type="datetime-local" className="input" min={minStr} />
              {errors.appointment_date && <p className="text-red-500 text-xs mt-1">{errors.appointment_date.message}</p>}
            </div>

            <div>
              <label className="label">Notes <span className="text-gray-400">(optional)</span></label>
              <textarea {...register('notes')} rows={3} className="input" placeholder="Describe your symptoms or reason for visit…" />
              {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isPending} className="btn-primary flex-1">
                {isPending ? 'Booking…' : 'Book Appointment'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Appointments() {
  const { profile, session } = useAuth()
  const qc = useQueryClient()
  const [showBook, setShowBook] = useState(false)

  const isPatient = profile?.role === 'patient'

  const { data: patientRecord } = useQuery({
    queryKey: ['patient-self', session?.user.id],
    enabled: isPatient,
    queryFn: async () => {
      const { data } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', session.user.id)
        .single()
      return data
    },
  })

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', profile?.role, session?.user.id],
    enabled: !!profile,
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('id, appointment_date, status, notes, patients!patient_id(id, profiles!profile_id(full_name)), profiles!doctor_id(full_name)')
        .order('appointment_date', { ascending: false })

      if (profile.role === 'patient' && patientRecord?.id) {
        query = query.eq('patient_id', patientRecord.id)
      } else if (profile.role === 'doctor') {
        query = query.eq('doctor_id', session.user.id)
      }

      const { data } = await query
      return data ?? []
    },
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Appointment updated')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: () => toast.error('Failed to update appointment.'),
  })

  const canCancel = (apt) => {
    if (profile?.role === 'admin') return true
    if (profile?.role === 'patient' && apt.patients?.id === patientRecord?.id) return true
    return false
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isPatient ? 'View and book your appointments.' : 'Manage patient appointments.'}
          </p>
        </div>
        {isPatient && patientRecord && (
          <button onClick={() => setShowBook(true)} className="btn-primary">
            + Book Appointment
          </button>
        )}
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
                {!isPatient && <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Doctor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date & Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments?.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                  {!isPatient && (
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {apt.patients?.profiles?.full_name ?? '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-700">{apt.profiles?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(apt.appointment_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge capitalize ${STATUS_COLORS[apt.status] ?? ''}`}>{apt.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {apt.status === 'scheduled' && profile?.role === 'doctor' && (
                        <button
                          onClick={() => updateStatus({ id: apt.id, status: 'completed' })}
                          className="text-green-600 hover:underline text-xs font-medium"
                        >
                          Mark Done
                        </button>
                      )}
                      {apt.status === 'scheduled' && canCancel(apt) && (
                        <button
                          onClick={() => updateStatus({ id: apt.id, status: 'cancelled' })}
                          className="text-red-500 hover:underline text-xs font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No appointments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showBook && patientRecord && (
        <BookModal patientId={patientRecord.id} onClose={() => setShowBook(false)} />
      )}
    </div>
  )
}
