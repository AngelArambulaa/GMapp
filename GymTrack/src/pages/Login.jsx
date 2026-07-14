import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login }             = useAuth()
  const navigate              = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'coach' ? '/coach' : '/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0a0a0a]">

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96
                      bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative page-enter">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center
                          mx-auto mb-5 shadow-xl shadow-brand-500/30">
            <span className="text-3xl">🏋️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Log in to continue training</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              name="email" type="email" value={form.email} onChange={handle}
              className="input-field" placeholder="you@example.com"
              required autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              name="password" type="password" value={form.password} onChange={handle}
              className="input-field" placeholder="••••••••"
              required autoComplete="current-password"
            />
          </div>

          {error && <p className="error-box">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        {/* Test accounts */}
        <div className="mt-6 p-3.5 bg-white/[0.03] border border-white/[0.07] rounded-2xl
                        text-xs text-gray-500 space-y-1.5">
          <p className="font-semibold text-gray-400 mb-2">🧪 Test accounts</p>
          <p><span className="text-gray-600">Athlete:</span> athlete@test.com · 12345678</p>
          <p><span className="text-gray-600">Coach:</span>   coach@test.com   · 12345678</p>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}