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
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Wrong Email or Password!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 p-4">
      {/* decorative background curves */}
      <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-blue-900/30 blur-sm pointer-events-none" />
      <div className="absolute -bottom-48 -right-32 w-[40rem] h-[40rem] rounded-full bg-blue-500/20 blur-sm pointer-events-none" />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl px-8 sm:px-10 py-12 min-h-[28rem] flex flex-col">
        <h1 className="text-4xl font-extrabold text-gray-700 text-center mb-10">Login</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <input
                {...register('email')}
                type="email"
                className="w-full bg-gray-100 rounded-full py-3.5 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Email"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1 ml-4">{errors.email.message}</p>}
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full bg-gray-100 rounded-full py-3.5 pl-12 pr-12 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 ml-4">{errors.password.message}</p>}
          </div>
{/* 
          <label className="flex items-center gap-2 pl-1 text-gray-500 text-sm cursor-pointer select-none">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-amber-400" />
            Remember me
          </label> */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 py-3.5 text-white text-lg font-medium tracking-widest uppercase shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        {/* <p className="text-center text-gray-500 text-sm mt-6">
          <Link to="/login" className="hover:underline">Forget Password</Link>
        </p> */}

        <p className="text-center text-sm text-gray-500 mt-auto pt-10">
          Not a member?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">Sign up now</Link>
        </p>
      </div>
    </div>
  )
}
