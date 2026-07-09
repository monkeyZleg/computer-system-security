import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const SPRAY_ATTEMPTS = [
  { user: 'doctor_john@hpms.com',   pass: 'password123' },
  { user: 'admin@hpms.com',         pass: 'admin1234' },
  { user: 'nurse_sara@hpms.com',    pass: 'qwerty123' },
  { user: 'doctor_lee@hpms.com',    pass: 'Welcome1!' },
  { user: 'patient001@hpms.com',    pass: 'Hospital@1' },
]

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [rawError, setRawError] = useState(null)
  const [sprayActive, setSprayActive] = useState(false)
  const [sprayIdx, setSprayIdx] = useState(0)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data) {
    setLoading(true)
    setRawError(null)
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.message ?? 'Unknown error'
      setRawError(msg)
      setFailedAttempts(n => n + 1)
    } finally {
      setLoading(false)
    }
  }

  function simulateSpray() {
    setSprayActive(true)
    let i = 0
    const tick = setInterval(() => {
      setSprayIdx(i)
      i++
      if (i >= SPRAY_ATTEMPTS.length) clearInterval(tick)
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HPMS</h1>
          <p className="text-gray-500 text-sm mt-1">Healthcare Patient Management System</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sign in to your account</h2>

          {/* Failed attempt counter */}
          {failedAttempts > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm flex items-center gap-3">
              <span className="text-red-600 font-mono font-bold text-lg">{failedAttempts}</span>
              <div>
                <p className="text-red-700 font-medium">Failed attempts — no lockout will ever occur ∞</p>
                <p className="text-red-500 text-xs">A secure system would lock the account after 3–5 attempts.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" className="input" placeholder="you@hospital.com" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="••••••••" autoComplete="current-password" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Raw error message leak */}
          {rawError && (
            <div className="mt-4 p-3 bg-gray-900 rounded-lg text-xs font-mono">
              <p className="text-yellow-400 mb-1">// Raw server error returned to browser:</p>
              <p className="text-red-400">{rawError}</p>
              <p className="text-gray-500 mt-1">// A secure system shows only: "Login failed. Try again."</p>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            New patient?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">Create an account</Link>
          </p>
        </div>

        {/* Credential spray simulation panel */}
        <div className="card mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">🤖 Password Spray Attack Simulation</p>
              <p className="text-xs text-gray-500">Attacker tests common passwords across accounts — no lockout stops them.</p>
            </div>
            <button onClick={simulateSpray} disabled={sprayActive} className="btn-danger text-xs px-3 py-1.5">
              Run Demo
            </button>
          </div>
          <div className="space-y-1.5">
            {SPRAY_ATTEMPTS.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-2 rounded text-xs font-mono transition-all ${
                  sprayActive && i <= sprayIdx ? 'bg-red-50 opacity-100' : 'bg-gray-50 opacity-40'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                  sprayActive && i <= sprayIdx ? 'bg-red-500' : 'bg-gray-300'
                }`}>✗</span>
                <span className="text-gray-700">{a.user}</span>
                <span className="text-gray-400">:</span>
                <span className="text-red-600">{a.pass}</span>
                {sprayActive && i <= sprayIdx && (
                  <span className="ml-auto text-red-500">→ Attempt {i + 1} sent — no lockout</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
