import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import * as patientsApi from '../api/patients'
import VulnerabilityBanner from '../components/VulnerabilityBanner'

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
  const [exposedRecord, setExposedRecord] = useState(null)

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

      await patientsApi.createPatientRecord({
        user_id: newUser.id,
        date_of_birth: data.date_of_birth,
      })

      setExposedRecord({
        id: newUser.id ?? 'a3f7b2c1-...',
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        phone_number: data.phone_number || null,
        role: 1,
        created_at: new Date().toISOString(),
      })

      toast.success('Account created — see what was stored below!')
    } catch (err) {
      toast.error(err?.message?.includes('duplicate') ? 'An account with this email already exists.' : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (exposedRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
              <span className="text-white text-2xl font-bold">H</span>
            </div>
          </div>

          <VulnerabilityBanner
            issue="1"
            title="Password Stored as Plain Text"
            description="Your password was just saved to the database exactly as you typed it — no hashing, no encryption. Anyone with database access can read it directly."
            attacker="If the database is leaked or an insider looks at the users table, your actual password is visible in plain text."
          />

          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-3">What was inserted into the database:</p>
            <div className="bg-gray-900 rounded-lg p-4 text-xs font-mono space-y-1 overflow-x-auto">
              <p className="text-green-400">INSERT INTO users (full_name, email, <span className="text-red-400 font-bold">password</span>, phone_number, role)</p>
              <p className="text-green-400">VALUES (</p>
              <p className="text-blue-300 pl-4">&apos;{exposedRecord.full_name}&apos;,</p>
              <p className="text-blue-300 pl-4">&apos;{exposedRecord.email}&apos;,</p>
              <p className="text-red-400 font-bold pl-4">&apos;{exposedRecord.password}&apos;  <span className="text-yellow-400">-- ← stored exactly as typed!</span></p>
              <p className="text-blue-300 pl-4">{exposedRecord.phone_number ? `'${exposedRecord.phone_number}'` : 'NULL'},</p>
              <p className="text-blue-300 pl-4">1  <span className="text-gray-500">-- role_id for &apos;patient&apos;</span></p>
              <p className="text-green-400">);</p>
            </div>

            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs">
              <p className="font-semibold text-orange-800 mb-1">What should happen instead:</p>
              <p className="text-orange-700 font-mono">password = bcrypt.hash(&apos;{exposedRecord.password}&apos;, 12)</p>
              <p className="text-orange-600 mt-1">→ <span className="font-mono">$2b$12$KIXt9bN...Qz7Vl</span> (unreadable 60-char hash)</p>
            </div>

            <button onClick={() => navigate('/login')} className="btn-primary w-full mt-4">
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    )
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

        <VulnerabilityBanner
          issue="1"
          title="Password Stored as Plain Text"
          description="This system stores your password exactly as typed — no hashing or encryption is applied before saving to the database."
          attacker="Any staff member with database access can read your password directly from the users table."
        />

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
