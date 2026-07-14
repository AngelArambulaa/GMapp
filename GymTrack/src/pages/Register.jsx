import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { register }          = useAuth()
  const navigate              = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'athlete' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'coach' ? '/coach' : '/')
    } catch (err) {
      setError(err.message || 'Registration failed')
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center
                          mx-auto mb-5 shadow-xl shadow-brand-500/30">
            <span className="text-3xl">🏋️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Start tracking your training</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              name="name" value={form.name} onChange={handle}
              className="input-field" placeholder="John Smith" required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              name="email" type="email" value={form.email} onChange={handle}
              className="input-field" placeholder="you@example.com" required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              name="password" type="password" value={form.password} onChange={handle}
              className="input-field" placeholder="Min. 8 characters" required
            />
          </div>

          {/* Role picker */}
          <div>
            <label className="label">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'athlete', emoji: '🏃', label: 'Athlete', desc: 'Log my training'  },
                { value: 'coach',   emoji: '📋', label: 'Coach',   desc: 'Manage athletes' },
              ].map(({ value, emoji, label, desc }) => (
                <button
                  key={value} type="button"
                  onClick={() => setForm(f => ({ ...f, role: value }))}
                  className={`py-3 px-4 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.role === value
                      ? 'border-brand-500 bg-brand-500/10 text-white shadow-lg shadow-brand-500/10'
                      : 'border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/[0.03]'
                  }`}
                >
                  <p className="font-semibold text-sm">{emoji} {label}</p>
                  <p className="text-xs opacity-50 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error-box">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Log in
          </Link>
        </p>

      </div>
    </div>
  )
}