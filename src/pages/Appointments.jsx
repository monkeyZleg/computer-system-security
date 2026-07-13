import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import * as usersApi from '../api/users'
import * as patientsApi from '../api/patients'
import * as appointmentsApi from '../api/appointments'
import { queryKeys } from '../api/queryKeys'
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
    queryKey: queryKeys.doctorsList,
    queryFn: async () => {
      const res = await usersApi.listDoctors()
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await appointmentsApi.bookAppointment({
        patient_id: patientId,
        doctor_id: data.doctor_id,
        appointment_date: data.appointment_date,
        notes: data.notes,
      })
      if (res.error) throw new Error(res.details)
      return res.data
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
              <textarea {...register('notes')} rows={3} className="input" placeholder="Describe your symptoms…" />
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
    queryKey: queryKeys.patientSelfId(session?.user.id),
    enabled: isPatient,
    queryFn: async () => {
      const res = await patientsApi.getPatientIdByUserId(session.user.id)
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  const { data: appointments, isLoading } = useQuery({
    queryKey: queryKeys.appointments(profile?.role, session?.user.id),
    enabled: !!profile,
    queryFn: async () => {
      const res = await appointmentsApi.listAppointments({
        role: profile.role,
        userId: session.user.id,
        patientId: patientRecord?.id,
      })
      if (res.error) throw new Error(res.details)
      return res.data
    },
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, status }) => {
      const viewer = { role: profile.role, userId: session.user.id, patientId: patientRecord?.id }
      const res = await appointmentsApi.updateAppointmentStatus(id, status, viewer)
      if (res.error) throw new Error(res.details)
      return res.data
    },
    onSuccess: () => {
      toast.success('Appointment updated')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err) => toast.error(err?.message ?? 'Failed to update appointment.'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
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
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                      APT-{apt.id}
                    </span>
                  </td>
                  {!isPatient && (
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {apt.patients?.users?.full_name ?? '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-700">{apt.users?.full_name ?? '—'}</td>
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
                      {apt.status === 'scheduled' && (
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
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No appointments found.</td></tr>
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
