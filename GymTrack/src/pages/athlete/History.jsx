import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { sessionsApi } from '../../api'

export default function History() {
  const navigate                    = useNavigate()
  const [sessions, setSessions]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => {
    sessionsApi.list()
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e, id) => {
    e.stopPropagation() // prevent navigating to detail
    if (!confirm('Delete this session?')) return
    setDeleting(id)
    try {
      await sessionsApi.delete(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <AppLayout title="History">
      <h2 className="text-xl font-bold text-white mb-5">Workout History</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400">No sessions yet</p>
          <p className="text-gray-600 text-sm mt-1">Complete a workout to see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const sets      = s.sets || []
            const volume    = sets.reduce((sum, set) => sum + (set.weight_kg || 0) * set.reps, 0)
            const exercises = [...new Set(sets.map(set => set.exercise?.name).filter(Boolean))]
            return (
              <div
                key={s.id}
                className="card cursor-pointer hover:border-white/20 transition-all duration-150 active:scale-[0.99]"
                onClick={() => navigate(`/history/${s.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white">{formatDate(s.date)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatTime(s.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      s.status === 'completed'
                        ? 'bg-brand-500/15 text-brand-400'
                        : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {s.status === 'completed' ? 'Done' : 'In progress'}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, s.id)}
                      disabled={deleting === s.id}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg"
                    >
                      {deleting === s.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { value: sets.length,               label: 'Sets'      },
                    { value: exercises.length,           label: 'Exercises' },
                    { value: `${Math.round(volume)}kg`,  label: 'Volume'    },
                  ].map(({ value, label }) => (
                    <div key={label} className="bg-white/[0.04] rounded-xl py-2 text-center">
                      <p className="font-bold text-white text-sm">{value}</p>
                      <p className="text-[11px] text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Exercise tags */}
                {exercises.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {exercises.slice(0, 4).map(ex => (
                      <span key={ex} className="text-xs bg-white/[0.04] border border-white/[0.08] text-gray-400 px-2.5 py-1 rounded-full">
                        {ex}
                      </span>
                    ))}
                    {exercises.length > 4 && (
                      <span className="text-xs text-gray-600 py-1">+{exercises.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Tap hint */}
                <p className="text-[11px] text-gray-700 mt-3 text-right">Tap to view details →</p>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}