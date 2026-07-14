import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { sessionsApi } from '../../api'

export default function SessionDetail() {
  const { sessionId }       = useParams()
  const navigate            = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sessionsApi.get(sessionId)
      .then(r => setSession(r.data))
      .catch(() => navigate('/history'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (loading) {
    return (
      <AppLayout title="Session" back>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!session) return null

  const sets      = session.sets || []
  const volume    = sets.reduce((sum, s) => sum + (s.weight_kg || 0) * s.reps, 0)
  const exercises = [...new Map(sets.map(s => [s.exercise?.id, s.exercise])).values()].filter(Boolean)

  // Group sets by exercise
  const grouped = sets.reduce((acc, s) => {
    const name = s.exercise?.name || 'Unknown'
    if (!acc[name]) acc[name] = { exercise: s.exercise, sets: [] }
    acc[name].sets.push(s)
    return acc
  }, {})

  return (
    <AppLayout title="Session Detail" back>

      {/* Header */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">{formatTime(session.date)}</p>
        <h2 className="text-xl font-bold text-white mt-0.5">{formatDate(session.date)}</h2>
        <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${
          session.status === 'completed'
            ? 'bg-brand-500/15 text-brand-400'
            : 'bg-yellow-500/15 text-yellow-400'
        }`}>
          {session.status === 'completed' ? 'Completed' : 'In progress'}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: sets.length,               label: 'Total sets'  },
          { value: exercises.length,           label: 'Exercises'  },
          { value: `${Math.round(volume)}kg`,  label: 'Volume'     },
        ].map(({ value, label }) => (
          <div key={label} className="card text-center py-3">
            <p className="text-xl font-bold text-brand-400">{value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([name, { exercise, sets: exSets }]) => {
          const bestWeight = Math.max(...exSets.map(s => s.weight_kg || 0))
          const totalVol   = exSets.reduce((sum, s) => sum + (s.weight_kg || 0) * s.reps, 0)

          return (
            <div key={name} className="card">
              {/* Exercise header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{exercise?.muscle_group}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Volume</p>
                  <p className="text-sm font-semibold text-brand-400">{Math.round(totalVol)} kg</p>
                </div>
              </div>

              {/* Sets table */}
              <div className="space-y-1.5">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-2 px-3 pb-1 border-b border-white/[0.06]">
                  {['Set', 'Reps', 'Weight', 'RPE'].map(h => (
                    <p key={h} className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{h}</p>
                  ))}
                </div>

                {/* Set rows */}
                {exSets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map(s => (
                    <div
                      key={s.id}
                      className={`grid grid-cols-4 gap-2 px-3 py-2 rounded-xl ${
                        s.weight_kg === bestWeight && bestWeight > 0
                          ? 'bg-brand-500/10 border border-brand-500/20'
                          : 'bg-white/[0.02]'
                      }`}
                    >
                      <p className="text-sm text-gray-400">{s.set_number}</p>
                      <p className="text-sm font-medium text-white">{s.reps}</p>
                      <p className="text-sm font-medium text-white">
                        {s.weight_kg ? `${s.weight_kg} kg` : '—'}
                        {s.weight_kg === bestWeight && bestWeight > 0 && (
                          <span className="ml-1 text-[10px] text-brand-400">🏆</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">{s.rpe || '—'}</p>
                    </div>
                  ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="card mt-4">
          <p className="label mb-1">Notes</p>
          <p className="text-sm text-gray-300">{session.notes}</p>
        </div>
      )}

    </AppLayout>
  )
}