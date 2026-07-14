import { useState, useEffect } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import AppLayout from '../../components/layout/AppLayout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../../contexts/AuthContext'
import { usersApi } from '../../api'

const METRICS = [
  { key: 'max_weight',   label: 'Max Weight (kg)' },
  { key: 'total_volume', label: 'Volume (kg)'     },
  { key: 'total_sets',   label: 'Sets'            },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-[140px]">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <span className="text-gray-500">{p.name}</span>
          <span className="font-bold" style={{ color: p.color }}>
            {p.value}{p.name === 'Weight' ? ' kg' : p.name === 'Reps' ? ' reps' : ''}
          </span>
        </div>
      ))}
      {d?.max_weight > 0 && d?.max_weight_reps > 0 && (
        <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-white/[0.06]">
          <span className="text-gray-500">Est. 1RM</span>
          <span className="font-bold text-yellow-400">
            {Math.round(d.max_weight * (1 + d.max_weight_reps / 30))} kg
          </span>
        </div>
      )}
    </div>
  )
}

export default function Progress() {
  const { user }                    = useAuth()
  const [progress, setProgress]     = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [metric, setMetric]         = useState('max_weight')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    usersApi.progress(user.id)
      .then(r => {
        setProgress(r.data)
        if (r.data.length > 0) setSelectedId(r.data[0].exercise.id)
      })
      .finally(() => setLoading(false))
  }, [user.id])

  const current = progress.find(p => p.exercise.id === selectedId)

  const chartData = current?.data_points.map(d => ({
    date:            new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    max_weight:      d.max_weight > 0 ? d.max_weight : null,     // null = no weight that day
    max_weight_reps: d.max_weight_reps > 0 ? d.max_weight_reps : null,
    bodyweight_reps: d.max_weight === 0 ? d.max_weight_reps : null, // reps with no weight
    total_volume:    Math.round(d.total_volume),
    total_sets:      d.total_sets,
    // keep raw for tooltip
    _max_weight:     d.max_weight,
    _max_weight_reps: d.max_weight_reps,
  })) || []

  // Does this exercise have any weighted sessions?
  const hasWeighted   = chartData.some(d => d.max_weight !== null)
  // Does it have any bodyweight sessions?
  const hasBodyweight = chartData.some(d => d.bodyweight_reps !== null)

  const pr = current?.data_points.length
    ? Math.max(...current.data_points.filter(d => d.max_weight > 0).map(d => d.max_weight), 0)
    : 0

  const prPoint     = current?.data_points.find(d => d.max_weight === pr && pr > 0)
  const estimated1RM = prPoint
    ? Math.round(prPoint.max_weight * (1 + prPoint.max_weight_reps / 30))
    : null

  const bestReps = current?.data_points.length
    ? Math.max(...current.data_points.map(d => d.max_weight_reps), 0)
    : 0

  return (
    <AppLayout title="Progress">
      <h2 className="text-xl font-bold text-white mb-5">Progress</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : progress.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-gray-400">No progress data yet</p>
          <p className="text-gray-600 text-sm mt-1">Complete some sessions to see your charts</p>
        </div>
      ) : (
        <>
          {/* Exercise tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
            {progress.map(p => (
              <button
                key={p.exercise.id}
                onClick={() => setSelectedId(p.exercise.id)}
                className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-full border transition-all ${
                  selectedId === p.exercise.id
                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {p.exercise.name}
              </button>
            ))}
          </div>

          {/* Metric selector */}
          <div className="flex gap-2 mb-5">
            {METRICS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`flex-1 text-xs py-2 rounded-xl border transition-colors ${
                  metric === key
                    ? 'bg-white/[0.08] border-white/20 text-white'
                    : 'border-white/[0.06] text-gray-500 hover:border-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* PR banner */}
          {metric === 'max_weight' && current?.data_points.length > 0 && (
            <div className="bg-brand-500/10 border border-brand-500/30 rounded-2xl px-4 py-3 mb-5">
              {pr > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Best Weighted Set</p>
                    <p className="font-bold text-brand-400 text-xl">
                      {pr} kg
                      {prPoint?.max_weight_reps > 0 && (
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          × {prPoint.max_weight_reps} reps
                        </span>
                      )}
                    </p>
                  </div>
                  {estimated1RM && (
                    <div className="text-right border-l border-white/10 pl-3">
                      <p className="text-[11px] text-gray-500">Est. 1RM</p>
                      <p className="text-lg font-bold text-yellow-400">{estimated1RM} kg</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💪</span>
                  <div>
                    <p className="text-xs text-gray-400">Best Bodyweight Performance</p>
                    <p className="font-bold text-brand-400 text-xl">
                      {bestReps} reps
                    </p>
                  </div>
                </div>
              )}

              {/* Show both stats if exercise has both */}
              {hasWeighted && hasBodyweight && (
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                  <FontAwesomeIcon icon="fa-solid fa-bolt" className="text-yellow-400 text-xs" />
                  <p className="text-xs text-gray-500">
                    This exercise has both weighted and bodyweight sessions
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chart */}
          {current && chartData.length > 0 && (
            <div className="card mb-5">
              <p className="font-semibold text-white text-sm">{current.exercise.name}</p>
              <p className="text-xs text-gray-500 mb-5">
                {metric === 'max_weight'
                  ? hasWeighted && hasBodyweight
                    ? 'Weight (kg) and bodyweight reps over time'
                    : hasWeighted
                    ? 'Max weight (kg) and reps over time'
                    : 'Bodyweight reps over time'
                  : METRICS.find(m => m.key === metric)?.label + ' over time'
                }
              </p>

              <ResponsiveContainer width="100%" height={220}>
                {metric === 'max_weight' ? (
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    {/* Left axis — weight */}
                    <YAxis
                      yAxisId="weight"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    {/* Right axis — reps */}
                    <YAxis
                      yAxisId="reps"
                      orientation="right"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Weight line — red */}
                    {hasWeighted && (
                      <Line
                        yAxisId="weight"
                        type="monotone"
                        dataKey="max_weight"
                        name="Weight"
                        stroke="#dc2626"
                        strokeWidth={2.5}
                        dot={{ fill: '#dc2626', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#f87171' }}
                        connectNulls={false}
                      />
                    )}

                    {/* Reps line — blue (weighted sessions) */}
                    {hasWeighted && (
                      <Line
                        yAxisId="reps"
                        type="monotone"
                        dataKey="max_weight_reps"
                        name="Reps"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#60a5fa' }}
                        connectNulls={false}
                      />
                    )}

                    {/* Bodyweight reps line — green */}
                    {hasBodyweight && (
                      <Line
                        yAxisId="reps"
                        type="monotone"
                        dataKey="bodyweight_reps"
                        name="BW Reps"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#4ade80' }}
                        connectNulls={false}
                      />
                    )}
                  </ComposedChart>
                ) : (
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="main"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      yAxisId="main"
                      type="monotone"
                      dataKey={metric}
                      name={METRICS.find(m => m.key === metric)?.label}
                      stroke="#dc2626"
                      strokeWidth={2.5}
                      dot={{ fill: '#dc2626', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#f87171' }}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>

              {/* Legend */}
              {metric === 'max_weight' && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                  {hasWeighted && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-brand-500 rounded-full" />
                        <span className="text-[11px] text-gray-500">Weight (kg)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-blue-500 rounded-full opacity-70" style={{ borderTop: '1px dashed' }} />
                        <span className="text-[11px] text-gray-500">Reps at weight</span>
                      </div>
                    </>
                  )}
                  {hasBodyweight && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-green-500 rounded-full" />
                      <span className="text-[11px] text-gray-500">Bodyweight reps</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Session pills */}
          {metric === 'max_weight' && (
            <div className="card mb-5">
              <p className="text-[11px] text-gray-600 uppercase tracking-wide mb-3">
                Session by session
              </p>
              <div className="flex flex-wrap gap-2">
                {chartData.map((d, i) => {
                  const isWeighted   = d.max_weight !== null && d.max_weight > 0
                  const isBodyweight = d.bodyweight_reps !== null
                  const isBestWeight = isWeighted && d.max_weight === pr
                  const isBestReps   = isBodyweight && d.bodyweight_reps === bestReps

                  return (
                    <div key={i} className="text-center">
                      <div className={`text-xs font-bold px-2.5 py-1 rounded-full mb-1 ${
                        isBestWeight
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                          : isBestReps
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/[0.04] text-gray-300'
                      }`}>
                        {isWeighted
                          ? `${d.max_weight}kg × ${d.max_weight_reps}r`
                          : `BW × ${d.bodyweight_reps}r`
                        }
                      </div>
                      <p className="text-[10px] text-gray-600">{d.date}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary stats */}
          {current && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: pr > 0
                    ? `${pr} kg × ${prPoint?.max_weight_reps}r`
                    : bestReps > 0
                    ? `BW × ${bestReps}r`
                    : '—',
                  label: 'Personal Record',
                  icon:  'fa-solid fa-trophy',
                  color: 'text-yellow-400',
                },
                {
                  value: estimated1RM ? `${estimated1RM} kg` : '—',
                  label: 'Est. 1 Rep Max',
                  icon:  'fa-solid fa-bolt',
                  color: 'text-brand-400',
                },
                {
                  value: current.data_points.reduce((s, d) => s + d.total_sets, 0),
                  label: 'Total sets logged',
                  icon:  'fa-solid fa-fire',
                  color: 'text-orange-400',
                },
                {
                  value: current.data_points.length,
                  label: 'Sessions tracked',
                  icon:  'fa-solid fa-calendar-days',
                  color: 'text-blue-400',
                },
              ].map(({ value, label, icon, color }) => (
                <div key={label} className="card py-3 flex items-center gap-3">
                  <FontAwesomeIcon icon={icon} className={`${color} text-lg flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}