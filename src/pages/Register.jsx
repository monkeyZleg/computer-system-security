import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import * as patientsApi from '../api/patients'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone_number: z.string().regex(/^[0-9+\-\s]{7,20}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
})

function InputIcon({ children }) {
  return (
    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
      </svg>
    </span>
  )
}

const inputClass =
  'w-full bg-gray-100 rounded-full py-3.5 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400'

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      const newUser = await signUp({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone_number: data.phone_number || null,
      })

      const patRes = await patientsApi.createPatientRecord({
        user_id: newUser.id,
        date_of_birth: data.date_of_birth,
      })
      if (patRes.error) throw new Error(patRes.details)

      toast.success('Account created')
      navigate('/login')
    } catch (err) {
      toast.error(err?.message?.includes('already used') ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 p-4">
      {/* decorative background curves */}
      <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-blue-900/30 blur-sm pointer-events-none" />
      <div className="absolute -bottom-48 -right-32 w-[40rem] h-[40rem] rounded-full bg-blue-500/20 blur-sm pointer-events-none" />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 sm:px-10 py-12 flex flex-col">
        <h1 className="text-4xl font-extrabold text-gray-700 text-center mb-10">Sign Up</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <div className="relative">
              <InputIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </InputIcon>
              <input {...register('full_name')} className={inputClass} placeholder="Full Name" />
            </div>
            {errors.full_name && <p className="text-red-500 text-xs mt-1 ml-4">{errors.full_name.message}</p>}
          </div>

          <div>
            <div className="relative">
              <InputIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </InputIcon>
              <input {...register('email')} type="email" className={inputClass} placeholder="Email" autoComplete="email" />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 ml-4">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <InputIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </InputIcon>
              <input {...register('password')} type="password" className={inputClass} placeholder="Password (min. 8 characters)" autoComplete="new-password" />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 ml-4">{errors.password.message}</p>}
          </div>

          <div>
            <div className="relative">
              <InputIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </InputIcon>
              <input {...register('phone_number')} className={inputClass} placeholder="Phone Number (optional)" />
            </div>
            {errors.phone_number && <p className="text-red-500 text-xs mt-1 ml-4">{errors.phone_number.message}</p>}
          </div>

          <div>
            <div className="relative">
              <InputIcon>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </InputIcon>
              <input
                {...register('date_of_birth')}
                type="date"
                className={inputClass}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {errors.date_of_birth && <p className="text-red-500 text-xs mt-1 ml-4">{errors.date_of_birth.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 py-3.5 text-white text-lg font-medium tracking-widest uppercase shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already a member?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Log in now</Link>
        </p>
      </div>
    </div>
  )
}
