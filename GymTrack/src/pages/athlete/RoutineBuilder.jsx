import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { routinesApi, exercisesApi } from '../../api'

export default function AthleteRoutineBuilder() {
  const navigate    = useNavigate()
  const { id }      = useParams()
  const isEdit      = Boolean(id)

  const [form, setForm]           = useState({ name: '', description: '', days_per_week: 3 })
  const [exercises, setExercises] = useState([])
  const [selected, setSelected]   = useState([])
  const [search, setSearch]       = useState('')
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(isEdit)

  useEffect(() => {
    exercisesApi.list().then(r => setExercises(r.data))
    if (isEdit) {
      routinesApi.get(id)
        .then(r => {
          const { name, description, days_per_week, exercises: exs } = r.data
          setForm({ name, description: description || '', days_per_week })
          setSelected(
            [...exs]
              .sort((a, b) => a.order - b.order)
              .map(re => ({
                exercise:     re.exercise,
                sets:         re.sets,
                reps:         re.reps,
                rest_seconds: re.rest_seconds,
              }))
          )
        })
        .finally(() => setLoading(false))
    }
  }, [id])

  const filtered = exercises
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8)

  const addExercise = (ex) => {
    if (selected.find(s => s.exercise.id === ex.id)) return
    setSelected(prev => [...prev, { exercise: ex, sets: 3, reps: 10, rest_seconds: 60 }])
    setSearch('')
  }

  const updateField = (index, field, value) =>
    setSelected(prev => prev.map((s, i) => i === index ? { ...s, [field]: Number(value) } : s))

  const remove = (index) =>
    setSelected(prev => prev.filter((_, i) => i !== index))

  const moveUp = (index) => {
    if (index === 0) return
    setSelected(prev => {
      const arr = [...prev]
      ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
      return arr
    })
  }

  const moveDown = (index) => {
    if (index === selected.length - 1) return
    setSelected(prev => {
      const arr = [...prev]
      ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
      return arr
    })
  }

  const save = async () => {
    if (!form.name.trim()) { setError('Routine name is required'); return }
    if (selected.length === 0) { setError('Add at least one exercise'); return }
    setError('')
    setSaving(true)
    const payload = {
      ...form,
      exercises: selected.map((s, i) => ({
        exercise_id:  s.exercise.id,
        sets:         s.sets,
        reps:         s.reps,
        rest_seconds: s.rest_seconds,
        order:        i,
      })),
    }
    try {
      isEdit
        ? await routinesApi.update(id, payload)
        : await routinesApi.create(payload)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Routine" back>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={isEdit ? 'Edit Routine' : 'New Routine'} back>
      <h2 className="text-xl font-bold text-white mb-5">
        {isEdit ? 'Edit Routine' : 'Create Routine'}
      </h2>

      {/* Basic info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="label">Routine name *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="input-field"
            placeholder="e.g. My Push Day"
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="input-field resize-none"
            rows={2}
            placeholder="Optional notes…"
          />
        </div>
        <div>
          <label className="label">Days per week</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <button
                key={d}
                onClick={() => setForm(f => ({ ...f, days_per_week: d }))}
                className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                  form.days_per_week === d
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise search */}
      <div className="mb-5">
        <label className="label">Add exercises</label>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          placeholder="Search exercises to add…"
        />
        {search && (
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] divide-y divide-white/[0.06] overflow-hidden">
            {filtered.length === 0
              ? <p className="text-sm text-gray-500 px-4 py-3">No exercises found</p>
              : filtered.map(ex => {
                  const added = !!selected.find(s => s.exercise.id === ex.id)
                  return (
                    <button
                      key={ex.id}
                      onClick={() => addExercise(ex)}
                      disabled={added}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.05] transition-colors text-left disabled:opacity-40"
                    >
                      <div>
                        <span className="text-sm text-white">{ex.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{ex.muscle_group}</span>
                      </div>
                      <span className="text-xs font-medium text-brand-400">
                        {added ? '✓ Added' : '+ Add'}
                      </span>
                    </button>
                  )
                })
            }
          </div>
        )}
      </div>

      {/* Selected exercises */}
      {selected.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="label">{selected.length} exercise{selected.length !== 1 ? 's' : ''}</p>
          {selected.map((s, i) => (
            <div key={s.exercise.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-600 font-mono w-5 flex-shrink-0">{i + 1}.</span>
                  <p className="font-semibold text-white text-sm truncate">{s.exercise.name}</p>
                  <span className="text-xs text-gray-600 flex-shrink-0">{s.exercise.muscle_group}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i === selected.length - 1}
                    className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => remove(i)}
                    className="p-1 text-gray-600 hover:text-brand-400 transition-colors ml-1"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { field: 'sets',         label: 'Sets',     min: 1, max: 20  },
                  { field: 'reps',         label: 'Reps',     min: 1, max: 100 },
                  { field: 'rest_seconds', label: 'Rest (s)', min: 0, max: 600 },
                ].map(({ field, label, min, max }) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input
                      type="number"
                      value={s[field]}
                      min={min}
                      max={max}
                      onChange={e => updateField(i, field, e.target.value)}
                      className="input-field py-2 text-center font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="error-box mb-4">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="btn-primary w-full py-4 text-base"
      >
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Routine'}
      </button>
    </AppLayout>
  )
}