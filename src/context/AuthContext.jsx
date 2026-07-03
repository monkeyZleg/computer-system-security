import { createContext, useContext, useState } from 'react'
import * as authApi from '../api/auth'
import * as usersApi from '../api/users'

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
    const user = await authApi.signIn({ email, password })
    persist(user)
    return user
  }

  async function signUp(fields) {
    return authApi.signUp(fields)
  }

  async function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setProfile(null)
  }

  async function refetchProfile() {
    if (!profile) return
    const users = await usersApi.listUsers()
    const fresh = users.find(u => u.id === profile.id)
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
