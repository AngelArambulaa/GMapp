import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { routinesApi } from '../../api'

export default function RoutineDetail() {
  const { id }                    = useParams()
  const [routine, setRoutine]     = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    routinesApi.get(id)
      .then(r => setRoutine(r.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AppLayout title="Routine" back>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!routine) return null

  const sorted = [...(routine.exercises || [])].sort((a, b) => a.order - b.order)

  // Group exercises by muscle group for the summary
  const muscleGroups = [...new Set(sorted.map(re => re.exercise.muscle_group).filter(Boolean))]

  const totalSets   = sorted.reduce((sum, re) => sum + re.sets, 0)
  const totalVolume = sorted.reduce((sum, re) => sum + re.sets * re.reps, 0)

  return (
    <AppLayout title={routine.name} back>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{routine.name}</h2>
        {routine.description && (
          <p className="text-gray-400 text-sm mt-1">{routine.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs bg-white/[0.05] border border-white/10 text-gray-400
                           px-2.5 py-1 rounded-full">
            {routine.days_per_week}×/week
          </span>
          {muscleGroups.map(mg => (
            <span key={mg} className="text-xs bg-brand-500/10 border border-brand-500/20
                                      text-brand-400 px-2.5 py-1 rounded-full">
              {mg}
            </span>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: sorted.length, label: 'Exercises' },
          { value: totalSets,     label: 'Total sets' },
          { value: totalVolume,   label: 'Total reps' },
        ].map(({ value, label }) => (
          <div key={label} className="card text-center py-3">
            <p className="text-xl font-bold text-brand-400">{value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Exercise list */}
      <section className="mb-6">
        <h3 className="section-title">Exercise Order</h3>
        <div className="space-y-2">
          {sorted.map((re, index) => (
            <div key={re.id} className="card flex items-center gap-4">

              {/* Order number */}
              <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/20
                              flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-brand-400">{index + 1}</span>
              </div>

              {/* Exercise info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{re.exercise.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{re.exercise.muscle_group}</p>
              </div>

              {/* Sets / Reps / Rest */}
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <div>
                  <p className="text-sm font-bold text-white">{re.sets}×{re.reps}</p>
                  <p className="text-[11px] text-gray-600">sets×reps</p>
                </div>
                {re.rest_seconds > 0 && (
                  <div>
                    <p className="text-sm font-bold text-white">{re.rest_seconds}s</p>
                    <p className="text-[11px] text-gray-600">rest</p>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Start button */}
      <Link
        to={`/log?routineId=${routine.id}`}
        className="btn-primary w-full py-4 text-base"
      >
        <FontAwesomeIcon icon="fa-solid fa-dumbbell" className="mr-2" />
        Start Workout
      </Link>

    </AppLayout>
  )
}