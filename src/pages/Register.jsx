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

export default function Register() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  // const [exposedRecord, setExposedRecord] = useState(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const watchedPassword = watch('password', '')
  const watchedEmail = watch('email', '')
  const watchedName = watch('full_name', '')

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

      // setExposedRecord({
      //   id: newUser.id ?? 'a3f7b2c1-...',
      //   full_name: data.full_name,
      //   email: data.email,
      //   password: data.password,
      //   phone_number: data.phone_number || null,
      //   role: 1,
      //   created_at: new Date().toISOString(),
      // })

      toast.success('Account created')
    } catch (err) {
      toast.error(err?.message?.includes('duplicate') ? 'An account with this email already exists.' : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Patient self-registration</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('full_name')} className="input" placeholder="John Doe" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <input {...register('email')} type="email" className="input" placeholder="you@email.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="Min. 8 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              {watchedPassword.length >= 4 && (
                <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs font-mono">
                  <span className="text-red-500">Will be stored as: </span>
                  <span className="text-red-700 font-bold">{watchedPassword}</span>
                  <span className="text-gray-400 ml-2">← plain text in DB</span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Phone Number <span className="text-gray-400">(optional)</span></label>
              <input {...register('phone_number')} className="input" placeholder="+60 12-345 6789" />
              {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number.message}</p>}
            </div>

            <div>
              <label className="label">Date of Birth</label>
              <input {...register('date_of_birth')} type="date" className="input" max={new Date().toISOString().split('T')[0]} />
              {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create Account (and see what gets stored)'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
