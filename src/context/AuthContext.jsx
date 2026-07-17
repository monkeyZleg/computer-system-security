import { createContext, useContext, useState } from 'react'
import * as authApi from '../api/auth'
import * as usersApi from '../api/users'
import { setSessionAuth, clearSessionKey } from '../lib/crypto'

const AuthContext = createContext(null)
const STORAGE_KEY = 'hpms.auth'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(() => readStored())

  function persist(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    setProfile(user)
  }

  async function signIn(email, password) {
    const res = await authApi.signIn({ email, password })
    if (res.error) throw new Error(res.details)
    // The data_key stays in sessionStorage only — never in the localStorage profile.
    const { data_key, ...user } = res.data
    setSessionAuth({ userId: user.id, dataKey: data_key })
    persist(user)
    return user
  }

  async function signUp(fields) {
    const res = await authApi.signUp(fields)
    if (res.error) throw new Error(res.details)
    // Set before returning: callers (e.g. patient self-registration) make
    // encrypted calls right after signUp, before any signIn.
    const { data_key, ...user } = res.data
    setSessionAuth({ userId: user.id, dataKey: data_key })
    return user
  }

  async function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    clearSessionKey()
    setProfile(null)
  }

  async function refetchProfile() {
    if (!profile) return
    const res = await usersApi.listUsers()
    if (res.error) {
      console.error('Failed to refetch profile:', res.details)
      return
    }
    const fresh = res.data.find(u => u.id === profile.id)
    if (fresh) persist(fresh)
  }

  const session = profile ? { user: { id: profile.id } } : null
  const loading = false

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
