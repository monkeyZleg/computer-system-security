import { useQuery } from '@tanstack/react-query'
import * as usersApi from '../api/users'
import * as patientsApi from '../api/patients'
import * as appointmentsApi from '../api/appointments'
import * as prescriptionsApi from '../api/prescriptions'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function PatientDashboard({ userId }) {
  const { data: patient } = useQuery({
    queryKey: queryKeys.patientSelfId(userId),
    queryFn: () => patientsApi.getPatientIdByUserId(userId),
  })

  const { data: appointments } = useQuery({
    queryKey: queryKeys.myAppointments(patient?.id),
    enabled: !!patient?.id,
    queryFn: () => appointmentsApi.getUpcomingAppointmentsForPatient(patient.id),
  })

  const { data: prescriptions } = useQuery({
    queryKey: queryKeys.myPrescriptions(patient?.id),
    enabled: !!patient?.id,
    queryFn: () => prescriptionsApi.getRecentPrescriptionsForPatient(patient.id),
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Upcoming Appointments" value={appointments?.length} icon="📅" color="blue" />
        <StatCard label="Active Prescriptions" value={prescriptions?.length} icon="💊" color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Upcoming Appointments</h3>
          {appointments?.length === 0 && <p className="text-gray-400 text-sm">No upcoming appointments.</p>}
          <ul className="space-y-3">
            {appointments?.map(apt => (
              <li key={apt.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{apt.users?.full_name ?? 'Doctor'}</p>
                  <p className="text-gray-500">{new Date(apt.appointment_date).toLocaleString()}</p>
                </div>
                <span className="badge bg-blue-100 text-blue-800 capitalize">{apt.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Prescriptions</h3>
          {prescriptions?.length === 0 && <p className="text-gray-400 text-sm">No prescriptions found.</p>}
          <ul className="space-y-3">
            {prescriptions?.map(rx => (
              <li key={rx.id} className="text-sm">
                <p className="font-medium text-gray-800">{rx.medication}</p>
                <p className="text-gray-500">{rx.dosage} · {rx.issue_date}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function DoctorDashboard({ userId }) {
  const { data: todayApts } = useQuery({
    queryKey: queryKeys.doctorToday(userId),
    queryFn: () => appointmentsApi.getTodayAppointmentsForDoctor(userId),
  })

  const { data: totalPatients } = useQuery({
    queryKey: queryKeys.doctorPatientsCount,
    queryFn: patientsApi.countPatients,
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Today's Appointments" value={todayApts?.length} icon="📅" color="blue" />
        <StatCard label="Total Patients" value={totalPatients} icon="👥" color="purple" />
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Today's Schedule</h3>
        {todayApts?.length === 0 && <p className="text-gray-400 text-sm">No appointments today.</p>}
        <ul className="divide-y divide-gray-100">
          {todayApts?.map(apt => (
            <li key={apt.id} className="py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-gray-800">
                  {apt.patients?.users?.full_name ?? 'Patient'}
                </p>
                <p className="text-gray-500">{new Date(apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className={`badge capitalize ${apt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {apt.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { data: counts } = useQuery({
    queryKey: queryKeys.adminCounts,
    queryFn: async () => {
      const [patients, staff, appointments] = await Promise.all([
        patientsApi.countPatients(),
        usersApi.countStaff(),
        appointmentsApi.countScheduledAppointments(),
      ])
      return { patients, staff, appointments }
    },
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Patients" value={counts?.patients} icon="👥" color="blue" />
        <StatCard label="Medical Staff" value={counts?.staff} icon="🩺" color="purple" />
        <StatCard label="Scheduled Appointments" value={counts?.appointments} icon="📅" color="orange" />
      </div>
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-2">Quick Links</h3>
        <p className="text-sm text-gray-500">Use the sidebar to navigate to Patient Records, Appointments, Prescriptions, or the Admin Panel.</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, session } = useAuth()

  if (!profile) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile.full_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{profile.role} · {new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {profile.role === 'patient' && <PatientDashboard userId={session.user.id} />}
      {(profile.role === 'doctor' || profile.role === 'nurse') && <DoctorDashboard userId={session.user.id} />}
      {profile.role === 'admin' && <AdminDashboard />}
    </div>
  )
}
