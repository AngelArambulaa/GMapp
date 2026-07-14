import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { sessionsApi, exercisesApi, routinesApi, usersApi } from '../../api'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function ResumeSession() {
  const navigate      = useNavigate()
  const { sessionId } = useParams()

  const [session, setSession]             = useState(null)
  const [routine, setRoutine]             = useState(null)
  const [exercises, setExercises]         = useState([])
  const [loggedSets, setLoggedSets]       = useState([])
  const [elapsed, setElapsed]             = useState(0)
  const timerRef                          = useRef(null)

  const [showRoutinePanel, setShowRoutinePanel] = useState(false)
  const [search, setSearch]               = useState('')
  const [showResults, setShowResults]     = useState(false)
  const [selectedEx, setSelectedEx]       = useState(null)
  const [prevRecord, setPrevRecord]       = useState(null)
  const [loadingRecord, setLoadingRecord] = useState(false)
  const [setForm, setSetForm]             = useState({ reps: '', weight_kg: '', rpe: '' })
  const [saving, setSaving]               = useState(false)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([
      sessionsApi.get(sessionId),
      exercisesApi.list(),
    ]).then(async ([s, ex]) => {
      const sessionData = s.data
      setSession(sessionData)
      setExercises(ex.data)
      setLoggedSets(sessionData.sets || [])

      // If session has a routine linked, fetch it
      if (sessionData.routine_id) {
        try {
          const r = await routinesApi.get(sessionData.routine_id)
          setRoutine(r.data)
        } catch {
          setRoutine(null)
        }
      }
    }).finally(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const doneExerciseIds = [...new Set(loggedSets.map(s => s.exercise?.id || s.exercise_id))]

  const sortedRoutineExercises = [...(routine?.exercises || [])]
    .sort((a, b) => a.order - b.order)

  const doneCount = sortedRoutineExercises.filter(re =>
    doneExerciseIds.includes(re.exercise.id)
  ).length

  const selectExercise = async (ex) => {
    setSelectedEx(ex)
    setSearch('')
    setShowResults(false)
    setShowRoutinePanel(false)
    setSetForm({ reps: '', weight_kg: '', rpe: '' })
    setPrevRecord(null)
    setLoadingRecord(true)
    try {
      const res = await usersApi.personalBest(ex.id)
      setPrevRecord(res.data)
    } catch {
      setPrevRecord(null)
    } finally {
      setLoadingRecord(false)
    }
  }

  const logSet = async () => {
    if (!selectedEx || !setForm.reps || !session) return
    setSaving(true)
    try {
      const prevCount = loggedSets.filter(s =>
        (s.exercise?.id || s.exercise_id) === selectedEx.id
      ).length
      const res = await sessionsApi.logSet(session.id, {
        exercise_id: selectedEx.id,
        set_number:  prevCount + 1,
        reps:        parseInt(setForm.reps),
        weight_kg:   setForm.weight_kg ? parseFloat(setForm.weight_kg) : null,
        rpe:         setForm.rpe       ? parseFloat(setForm.rpe)       : null,
      })
      setLoggedSets(prev => [...prev, { ...res.data, exercise: selectedEx }])
      setSetForm(f => ({ ...f, reps: '', rpe: '' }))
    } finally {
      setSaving(false)
    }
  }

  const deleteSet = async (setId) => {
    await sessionsApi.deleteSet(session.id, setId)
    setLoggedSets(prev => prev.filter(s => s.id !== setId))
  }

  const finishSession = async () => {
    await sessionsApi.complete(session.id)
    navigate('/')
  }

  const filtered = exercises
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8)

  const grouped = loggedSets.reduce((acc, s) => {
    const name = s.exercise?.name || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(s)
    return acc
  }, {})

  if (loading) {
    return (
      <AppLayout title="Resuming…" back>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={`Resuming · ${formatTime(elapsed)}`} back>

      {/* Info banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
        <span className="text-xl">⚡</span>
        <div>
          <p className="text-sm font-semibold text-yellow-400">Resuming session</p>
          <p className="text-xs text-gray-500 mt-0.5">{loggedSets.length} sets already logged</p>
        </div>
      </div>

      {/* Routine panel — same as LogSession */}
      {routine && (
        <div className="mb-4">
          <button
            onClick={() => setShowRoutinePanel(p => !p)}
            className="w-full card flex items-center justify-between py-3 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon="fa-solid fa-list-ol" className="text-brand-400 text-sm" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{routine.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {doneCount} / {sortedRoutineExercises.length} exercises started
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${sortedRoutineExercises.length > 0
                      ? (doneCount / sortedRoutineExercises.length) * 100
                      : 0}%`
                  }}
                />
              </div>
              <FontAwesomeIcon
                icon={showRoutinePanel ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}
                className="text-gray-500 text-xs"
              />
            </div>
          </button>

          {showRoutinePanel && (
            <div className="mt-2 card pt-2 pb-1 space-y-1">
              {sortedRoutineExercises.map((re, index) => {
                const isDone    = doneExerciseIds.includes(re.exercise.id)
                const isCurrent = selectedEx?.id === re.exercise.id
                return (
                  <button
                    key={re.id}
                    onClick={() => selectExercise(re.exercise)}
                    className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all text-left ${
                      isCurrent
                        ? 'bg-brand-500/15 border border-brand-500/30'
                        : isDone
                        ? 'opacity-50'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isCurrent
                        ? 'bg-brand-500 text-white'
                        : isDone
                        ? 'bg-white/10 text-gray-500'
                        : 'bg-white/[0.06] text-gray-400'
                    }`}>
                      {isDone && !isCurrent
                        ? <FontAwesomeIcon icon="fa-solid fa-check" className="text-[10px]" />
                        : index + 1
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-brand-400' : isDone ? 'text-gray-500 line-through' : 'text-white'
                      }`}>
                        {re.exercise.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {re.sets} sets · {re.reps} reps · {re.rest_seconds}s rest
                      </p>
                    </div>
                    {isDone && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {loggedSets.filter(s =>
                          (s.exercise?.id || s.exercise_id) === re.exercise.id
                        ).length} sets ✓
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs text-brand-400 flex-shrink-0 font-medium">Active</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Exercise picker */}
      {!selectedEx ? (
        <div className="mb-5">
          {routine && (
            <div className="mb-4">
              <p className="label">From your routine</p>
              <div className="flex flex-wrap gap-2">
                {sortedRoutineExercises.map(re => {
                  const isDone = doneExerciseIds.includes(re.exercise.id)
                  return (
                    <button
                      key={re.id}
                      onClick={() => selectExercise(re.exercise)}
                      className={`relative text-sm px-3 py-2 rounded-xl border transition-all duration-150 ${
                        isDone
                          ? 'bg-white/[0.03] border-white/[0.06] text-gray-600'
                          : 'bg-white/[0.05] border-white/10 text-gray-200 hover:border-brand-500 hover:text-white'
                      }`}
                    >
                      {isDone && (
                        <FontAwesomeIcon
                          icon="fa-solid fa-check"
                          className="text-brand-500 text-[10px] mr-1.5"
                        />
                      )}
                      {re.exercise.name}
                      <span className="text-gray-600 text-xs ml-1.5">{re.sets}×{re.reps}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <p className="label">{routine ? 'Or search all exercises' : 'Pick an exercise'}</p>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            className="input-field"
            placeholder="Search exercises…"
          />
          {showResults && search && (
            <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm divide-y divide-white/[0.06] overflow-hidden">
              {filtered.length === 0
                ? <p className="text-sm text-gray-500 px-4 py-3">No results</p>
                : filtered.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => selectExercise(ex)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <span className="text-sm text-white">{ex.name}</span>
                    <span className="text-xs text-gray-500">{ex.muscle_group}</span>
                  </button>
                ))
              }
            </div>
          )}
        </div>
      ) : (
        /* Set form */
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-white">{selectedEx.name}</p>
              <p className="text-xs text-gray-500">{selectedEx.muscle_group}</p>
            </div>
            <button
              onClick={() => { setSelectedEx(null); setPrevRecord(null) }}
              className="text-gray-500 hover:text-gray-300 p-1 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </button>
          </div>

          {/* Previous record */}
          {loadingRecord && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-gray-500">Loading your previous record…</p>
            </div>
          )}

          {!loadingRecord && prevRecord && prevRecord.best_weight && (
            <div className="bg-brand-500/[0.08] border border-brand-500/20 rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon="fa-solid fa-chart-line" className="text-brand-400 text-xs" />
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Last Session</p>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <p className="text-[11px] text-gray-600">Best weight</p>
                  <p className="text-lg font-bold text-white">{prevRecord.best_weight} kg</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-[11px] text-gray-600">Best reps</p>
                  <p className="text-lg font-bold text-white">{prevRecord.best_reps}</p>
                </div>
              </div>
              {prevRecord.last_sets?.length > 0 && (
                <div>
                  <p className="text-[11px] text-gray-600 mb-1.5">Sets last time</p>
                  <div className="flex flex-wrap gap-1.5">
                    {prevRecord.last_sets.map((s, i) => (
                      <span key={i} className="text-xs bg-white/[0.06] border border-white/10 text-gray-300 px-2.5 py-1 rounded-full">
                        {s.reps}r{s.weight_kg ? ` · ${s.weight_kg}kg` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loadingRecord && prevRecord && !prevRecord.best_weight && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-gray-500">
                <FontAwesomeIcon icon="fa-solid fa-bolt" className="text-yellow-400 mr-1.5" />
                First time logging this exercise — make it count!
              </p>
            </div>
          )}

          {/* Inputs */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { key: 'reps',      label: 'Reps *',    placeholder: prevRecord?.best_reps   || '10', step: '1'   },
              { key: 'weight_kg', label: 'Weight kg', placeholder: prevRecord?.best_weight || '60', step: '0.5' },
              { key: 'rpe',       label: 'RPE 1–10',  placeholder: '7',                              step: '0.5' },
            ].map(({ key, label, placeholder, step }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type="number"
                  value={setForm[key]}
                  onChange={e => setSetForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field py-3 text-center text-base font-semibold"
                  placeholder={String(placeholder)}
                  step={step}
                  inputMode="decimal"
                />
              </div>
            ))}
          </div>

          {/* Today's sets */}
          {loggedSets.filter(s =>
            (s.exercise?.id || s.exercise_id) === selectedEx.id
          ).length > 0 && (
            <div className="mb-4">
              <p className="label mb-2">Today's sets</p>
              <div className="space-y-1.5">
                {loggedSets
                  .filter(s => (s.exercise?.id || s.exercise_id) === selectedEx.id)
                  .map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2">
                      <span className="text-xs text-gray-600">Set {s.set_number}</span>
                      <span className="text-sm font-medium text-white">
                        {s.reps} reps
                        {s.weight_kg ? ` · ${s.weight_kg} kg` : ''}
                        {s.rpe       ? ` · RPE ${s.rpe}`      : ''}
                      </span>
                      <button
                        onClick={() => deleteSet(s.id)}
                        className="text-gray-600 hover:text-brand-400 transition-colors p-1"
                      >
                        <FontAwesomeIcon icon="fa-solid fa-xmark" className="text-xs" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <button
            onClick={logSet}
            disabled={!setForm.reps || saving}
            className="btn-primary w-full"
          >
            {saving
              ? 'Saving…'
              : `Log Set ${loggedSets.filter(s =>
                  (s.exercise?.id || s.exercise_id) === selectedEx.id
                ).length + 1}`
            }
          </button>
        </div>
      )}

      {/* Session summary */}
      {Object.keys(grouped).length > 0 && (
        <div className="mb-6">
          <p className="label">{loggedSets.length} set{loggedSets.length !== 1 ? 's' : ''} total</p>
          <div className="space-y-2">
            {Object.entries(grouped).map(([name, sets]) => (
              <div key={name} className="card py-3">
                <p className="font-semibold text-white text-sm mb-2">{name}</p>
                <div className="flex flex-wrap gap-2">
                  {sets.map(s => (
                    <span key={s.id} className="text-xs bg-white/[0.05] border border-white/10 text-gray-300 px-2.5 py-1 rounded-full">
                      {s.reps}r{s.weight_kg ? ` · ${s.weight_kg}kg` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={finishSession} className="btn-secondary w-full py-4 text-base">
        <FontAwesomeIcon icon="fa-solid fa-check" className="mr-2" />
        Finish Workout
      </button>

    </AppLayout>
  )
}