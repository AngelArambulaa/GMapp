import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import { usersApi, routinesApi } from '../../api'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-brand-400 font-bold">{payload[0].value} kg</p>
    </div>
  )
}

export default function AthleteDetail() {
  const { athleteId }               = useParams()
  const [athlete, setAthlete]       = useState(null)
  const [progress, setProgress]     = useState([])
  const [routines, setRoutines]     = useState([])
  const [selectedEx, setSelectedEx] = useState(null)
  const [assigning, setAssigning]   = useState(false)
  const [assignId, setAssignId]     = useState('')
  const [assignMsg, setAssignMsg]   = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      usersApi.allAthletes(),
      usersApi.progress(athleteId),
      routinesApi.list(),
    ]).then(([athletes, prog, rout]) => {
      setAthlete(athletes.data.find(a => a.id === athleteId))
      setProgress(prog.data)
      setRoutines(rout.data)
      if (prog.data.length > 0) setSelectedEx(prog.data[0].exercise.id)
    }).finally(() => setLoading(false))
  }, [athleteId])

  const assign = async () => {
    if (!assignId) return
    await routinesApi.assign(assignId, athleteId)
    const routine = routines.find(r => r.id === assignId)
    setAssigning(false)
    setAssignId('')
    setAssignMsg(`"${routine?.name}" assigned!`)
    setTimeout(() => setAssignMsg(''), 3000)
  }

  const current   = progress.find(p => p.exercise.id === selectedEx)
  const chartData = current?.data_points.map(d => ({
    date:   new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: d.max_weight,
  })) || []

  const pr = current?.data_points.length
    ? Math.max(...current.data_points.map(d => d.max_weight))
    : 0

  if (loading) {
    return (
      <AppLayout title="Athlete" back>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!athlete) {
    return (
      <AppLayout title="Athlete" back>
        <p className="text-gray-500 mt-6">Athlete not found.</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={athlete.name} back>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-brand-500/15 flex items-center justify-center
                        text-brand-400 text-2xl font-bold flex-shrink-0 border border-brand-500/20">
          {athlete.name[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{athlete.name}</h2>
          <p className="text-gray-500 text-sm">{athlete.email}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Member since {new Date(athlete.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Assign routine */}
      <div className="card mb-6">
        <p className="font-semibold text-white mb-3">Assign Routine</p>
        {assignMsg && (
          <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-2.5
                          text-brand-400 text-sm mb-3">
            ✓ {assignMsg}
          </div>
        )}
        {assigning ? (
          <div className="space-y-3">
            <select
              value={assignId}
              onChange={e => setAssignId(e.target.value)}
              className="input-field"
            >
              <option value="">Select a routine…</option>
              {routines.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={assign} className="btn-primary flex-1">Assign</button>
              <button onClick={() => setAssigning(false)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAssigning(true)} className="btn-secondary w-full">
            + Assign a Routine
          </button>
        )}
      </div>

      {/* Progress */}
      <section>
        <h3 className="section-title">Progress Charts</h3>

        {progress.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-gray-500 text-sm">No training data yet</p>
            <p className="text-gray-600 text-xs mt-1">Assign a routine to get started</p>
          </div>
        ) : (
          <>
            {/* Exercise tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
              {progress.map(p => (
                <button
                  key={p.exercise.id}
                  onClick={() => setSelectedEx(p.exercise.id)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-full border transition-all ${
                    selectedEx === p.exercise.id
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {p.exercise.name}
                </button>
              ))}
            </div>

            {/* Chart */}
            {current && chartData.length > 0 && (
              <div className="card mb-4">
                <p className="font-semibold text-white text-sm mb-1">{current.exercise.name}</p>
                <p className="text-xs text-gray-500 mb-4">Max weight over time (kg)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#dc2626"
                      strokeWidth={2.5}
                      dot={{ fill: '#dc2626', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#f87171' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stats */}
            {current && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: pr > 0 ? `${pr} kg` : '—',
                    label: 'Best weight',
                  },
                  {
                    value: current.data_points.length,
                    label: 'Sessions',
                  },
                  {
                    value: pr > 0
                      ? `+${(pr - current.data_points[0].max_weight).toFixed(1)} kg`
                      : '—',
                    label: 'Progress',
                  },
                ].map(({ value, label }) => (
                  <div key={label} className="card text-center py-3">
                    <p className="text-lg font-bold text-brand-400">{value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

    </AppLayout>
  )
}