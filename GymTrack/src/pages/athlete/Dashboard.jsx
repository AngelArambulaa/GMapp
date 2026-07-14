import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../contexts/AuthContext'
import { sessionsApi, routinesApi } from '../../api'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

export default function AthleteDashboard() {
  const { user }                = useAuth()
  const navigate                = useNavigate()
  const [sessions, setSessions] = useState([])
  const [routines, setRoutines] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([sessionsApi.list(), routinesApi.list()])
      .then(([s, r]) => { setSessions(s.data); setRoutines(r.data) })
      .finally(() => setLoading(false))
  }, [])

  const inProgress = sessions.filter(s => s.status === 'in_progress')
  const recent     = sessions.filter(s => s.status === 'completed').slice(0, 3)
  const weekSessions = sessions.filter(s => {
    const diff = (new Date() - new Date(s.date)) / (1000 * 60 * 60 * 24)
    return diff <= 7
  }).length

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const finishSession = async (sessionId) => {
    await sessionsApi.complete(sessionId)
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, status: 'completed' } : s
    ))
  }

  const deleteSession = async (sessionId) => {
    if (!confirm('Delete this session?')) return
    await sessionsApi.delete(sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const deleteRoutine = async (routineId) => {
    if (!confirm('Delete this routine?')) return
    try {
      await routinesApi.delete(routineId)
      setRoutines(prev => prev.filter(r => r.id !== routineId))
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete routine')
    }
  }

  return (
    <AppLayout title="GymApp">

      {/* Greeting */}
      <div className="mb-7">
        <p className="text-gray-600 text-sm">Good {greeting()}</p>
        <h2 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
          {user?.name?.split(' ')[0]} 👋
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: weekSessions,    label: 'This week' },
          { value: sessions.length, label: 'All time'  },
          { value: routines.length, label: 'Routines'  },
        ].map(({ value, label }) => (
          <div key={label} className="card text-center py-3">
            <p className="text-2xl font-bold text-brand-400">{loading ? '—' : value}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <Link to="/log" className="btn-primary text-center py-4 text-base">
          + Start Workout
        </Link>
        <Link to="/routines/new" className="btn-secondary text-center py-4 text-base">
          + Create Routine
        </Link>
      </div>

      {/* In progress sessions */}
      {!loading && inProgress.length > 0 && (
        <section className="mb-7">
          <h3 className="section-title">In Progress</h3>
          <div className="space-y-2">
            {inProgress.map(s => (
              <div key={s.id} className="card border-yellow-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white text-sm">{formatDate(s.date)}</p>
                    <p className="text-xs text-yellow-400 mt-0.5">In progress</p>
                  </div>
                  <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2.5 py-1 rounded-full font-medium">
                    {s.sets?.length || 0} sets
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/log/resume/${s.id}`)}
                    className="btn-primary flex-1 py-2 text-sm"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => finishSession(s.id)}
                    className="btn-secondary flex-1 py-2 text-sm"
                  >
                    Mark Done
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="btn-danger py-2 px-3 text-sm"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Routines */}
      {!loading && routines.length > 0 && (
        <section className="mb-7">
          <h3 className="section-title">Your Routines</h3>
          <div className="space-y-2">
            {routines.map(r => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-white text-sm">{r.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {r.exercises?.length || 0} exercises · {r.days_per_week}×/week
                    </p>
                  </div>
                  <Link
                    to={`/log?routineId=${r.id}`}
                    className="text-brand-500 hover:text-brand-400 text-sm font-semibold
                               transition-colors flex-shrink-0"
                  >
                    Start →
                  </Link>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link
                    to={`/routines/${r.id}/edit`}
                    className="flex-1 text-center text-xs text-gray-400 hover:text-white
                               bg-white/[0.05] hover:bg-white/[0.08] px-3 py-2 rounded-lg
                               transition-all duration-150"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteRoutine(r.id)}
                    className="flex-1 text-xs text-red-400 hover:text-red-300
                               bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg
                               transition-all duration-150"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent sessions */}
      <section>
        <h3 className="section-title">Recent Sessions</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">🏋️</p>
            <p className="text-gray-400 text-sm">No completed sessions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(s => (
              <div key={s.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-white text-sm">{formatDate(s.date)}</p>
                  <p className="text-xs text-gray-600">{s.sets?.length || 0} sets logged</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-500/15 text-brand-400">
                  Done
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

    </AppLayout>
  )
}