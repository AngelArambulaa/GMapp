import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../contexts/AuthContext'
import { routinesApi, usersApi } from '../../api'

export default function CoachDashboard() {
  const { user }                  = useAuth()
  const [routines, setRoutines]   = useState([])
  const [athletes, setAthletes]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([routinesApi.list(), usersApi.myAthletes()])
      .then(([r, a]) => { setRoutines(r.data); setAthletes(a.data) })
      .finally(() => setLoading(false))
  }, [])

  const deleteRoutine = async (id) => {
    if (!confirm('Delete this routine?')) return
    await routinesApi.delete(id)
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  return (
    <AppLayout title="Coach">

      {/* Greeting */}
      <div className="mb-7">
        <p className="text-gray-600 text-sm">Coach dashboard</p>
        <h2 className="text-2xl font-extrabold text-white mt-0.5 tracking-tight">
          {user?.name?.split(' ')[0]} 👋
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-brand-400">{loading ? '—' : athletes.length}</p>
          <p className="text-xs text-gray-600 mt-1">Athletes</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-brand-400">{loading ? '—' : routines.length}</p>
          <p className="text-xs text-gray-600 mt-1">Routines</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <Link to="/coach/routines/new" className="btn-primary text-center py-3">+ New Routine</Link>
        <Link to="/athletes"           className="btn-secondary text-center py-3">Find Athletes</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* My athletes */}
          <section className="mb-7">
            <h3 className="section-title">My Athletes</h3>
            {athletes.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500 text-sm">No athletes linked yet.</p>
                <Link to="/athletes" className="text-brand-400 text-sm mt-2 block">Find athletes →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {athletes.map(a => (
                  <Link
                    key={a.id}
                    to={`/coach/athletes/${a.id}`}
                    className="card flex items-center gap-3 hover:border-white/20 transition-all duration-150"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center
                                    text-brand-400 font-bold text-sm flex-shrink-0 border border-brand-500/20">
                      {a.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{a.name}</p>
                      <p className="text-xs text-gray-600 truncate">{a.email}</p>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="#4b5563" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Routines */}
          <section>
            <h3 className="section-title">My Routines</h3>
            {routines.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500 text-sm">No routines yet.</p>
                <Link to="/coach/routines/new" className="text-brand-400 text-sm mt-2 block">Create one →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {routines.map(r => (
                  <div key={r.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-semibold text-white">{r.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {r.exercises?.length || 0} exercises · {r.days_per_week}×/week
                        </p>
                        {r.description && (
                          <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{r.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link
                          to={`/coach/routines/${r.id}/edit`}
                          className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10
                                     px-2.5 py-1.5 rounded-lg transition-all duration-150"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteRoutine(r.id)}
                          className="text-xs text-red-400 hover:text-red-300 bg-red-500/10
                                     hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-all duration-150"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AppLayout>
  )
}