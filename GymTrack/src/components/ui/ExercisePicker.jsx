import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { exercisesApi } from '../../api'
import { useLang } from '../../contexts/LanguageContext'

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Legs', 'Shoulders',
  'Biceps', 'Triceps', 'Core', 'Cardio'
]

export default function ExercisePicker({ exercises, onSelect, onExerciseCreated, excludeIds = [] }) {
  const { lang, exName }          = useLang()
  const [search, setSearch]       = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '', name_es: '', muscle_group: 'Chest', exercise_type: 'strength'
  })
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')
  const [filter, setFilter]       = useState('All')

  const filtered = exercises
    .filter(e => {
      const matchSearch = search === '' ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.name_es && e.name_es.toLowerCase().includes(search.toLowerCase()))
      const matchFilter = filter === 'All' || e.muscle_group === filter
      return matchSearch && matchFilter
    })
    .slice(0, 12)

  const handleCreate = async () => {
    if (!createForm.name.trim()) { setError('Exercise name is required'); return }
    setError('')
    setCreating(true)
    try {
      const res = await exercisesApi.create({
        name:          createForm.name.trim(),
        name_es:       createForm.name_es.trim() || null,
        muscle_group:  createForm.muscle_group,
        exercise_type: createForm.exercise_type,
      })
      onExerciseCreated(res.data)
      onSelect(res.data)
      setShowCreate(false)
      setCreateForm({ name: '', name_es: '', muscle_group: 'Chest', exercise_type: 'strength' })
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create exercise')
    } finally {
      setCreating(false)
    }
  }

  if (showCreate) {
    return (
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-white">New Exercise</p>
          <button
            onClick={() => { setShowCreate(false); setError('') }}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <FontAwesomeIcon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Name (English) *</label>
            <input
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              className="input-field"
              placeholder="e.g. Cable Fly"
            />
          </div>
          <div>
            <label className="label">Nombre (Español)</label>
            <input
              value={createForm.name_es}
              onChange={e => setCreateForm(f => ({ ...f, name_es: e.target.value }))}
              className="input-field"
              placeholder="ej. Apertura en Polea"
            />
          </div>
          <div>
            <label className="label">Muscle Group</label>
            <select
              value={createForm.muscle_group}
              onChange={e => setCreateForm(f => ({ ...f, muscle_group: e.target.value }))}
              className="input-field"
            >
              {MUSCLE_GROUPS.map(mg => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {['strength', 'cardio', 'flexibility'].map(t => (
                <button
                  key={t}
                  onClick={() => setCreateForm(f => ({ ...f, exercise_type: t }))}
                  className={`flex-1 text-xs py-2 rounded-xl border capitalize transition-all ${
                    createForm.exercise_type === t
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error-box">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary w-full"
          >
            {creating ? 'Creating…' : 'Create Exercise'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5">
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field mb-3"
        placeholder={lang === 'es' ? 'Buscar ejercicio…' : 'Search exercise…'}
      />

      {/* Muscle group filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4">
        {['All', ...MUSCLE_GROUPS].map(mg => (
          <button
            key={mg}
            onClick={() => setFilter(mg)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === mg
                ? 'bg-brand-500 border-brand-500 text-white'
                : 'border-white/10 text-gray-500 hover:border-white/20'
            }`}
          >
            {mg}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] divide-y divide-white/[0.06] overflow-hidden mb-3">
        {filtered.length === 0 ? (
          <div className="px-4 py-4 text-center">
            <p className="text-sm text-gray-500 mb-2">No exercises found</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              + Create "{search}"
            </button>
          </div>
        ) : (
          filtered.map(ex => {
            const alreadyAdded = excludeIds.includes(ex.id)
            return (
              <button
                key={ex.id}
                onClick={() => !alreadyAdded && onSelect(ex)}
                disabled={alreadyAdded}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  alreadyAdded
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/[0.05]'
                }`}
              >
                <div>
                  <p className="text-sm text-white">{exName(ex)}</p>
                  {lang === 'es' && ex.name_es && (
                    <p className="text-xs text-gray-600">{ex.name}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{ex.muscle_group}</p>
                </div>
                <span className="text-xs font-medium text-brand-400 flex-shrink-0 ml-3">
                  {alreadyAdded ? '✓ Added' : '+ Add'}
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* Create new button */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full text-center text-xs text-gray-500 hover:text-brand-400
                   py-2 border border-dashed border-white/10 hover:border-brand-500/50
                   rounded-xl transition-all duration-150"
      >
        <FontAwesomeIcon icon="fa-solid fa-plus" className="mr-1.5" />
        {lang === 'es' ? 'Crear nuevo ejercicio' : 'Create new exercise'}
      </button>
    </div>
  )
}