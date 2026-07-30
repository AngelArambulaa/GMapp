import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { exercisesApi } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Legs', 'Shoulders',
  'Biceps', 'Triceps', 'Core', 'Cardio', 'Other'
]

const EMPTY_FORM = {
  name: '', muscle_group: 'Chest', exercise_type: 'strength', description: ''
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ exercise, onClose, onArchive, onDelete }) {
  const [usage, setUsage]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking]       = useState(false)

  useEffect(() => {
    exercisesApi.usage(exercise.id)
      .then(r => setUsage(r.data))
      .finally(() => setLoading(false))
  }, [exercise.id])

  const handleArchive = async () => {
    setWorking(true)
    await onArchive()
  }

  const handleDelete = async () => {
    setWorking(true)
    await onDelete(usage?.can_delete ? 'safe' : 'force')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal bottom-0 ----> top-10  sm flex */}
      <div className="fixed inset-x-0 top-10 z-50 px-4 pb-6 sm:inset-0 sm:items-center sm:justify-center">
        <div
          className="w-full max-w-sm mx-auto bg-gray-900 border border-white/10 rounded-2xl p-5"
          style={{ animation: 'slideUp 0.5s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">Remove "{exercise.name}"?</p>
              <p className="text-xs text-gray-500 mt-0.5">Choose how to handle this exercise</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-300 p-1 flex-shrink-0"
            >
              <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </button>
          </div>

          {/* Usage stats */}
          {loading ? (
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 mb-4">
              <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-gray-500">Checking workout history…</p>
            </div>
          ) : (
            <div className={`rounded-xl px-4 py-3 mb-4 ${
              usage.total_sets > 0
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-white/[0.03] border border-white/[0.06]'
            }`}>
              {usage.total_sets > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" className="text-yellow-400 text-xs" />
                    <p className="text-xs font-semibold text-yellow-400">This exercise has workout history</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white/[0.04] rounded-xl py-2 text-center">
                      <p className="text-xl font-bold text-white">{usage.total_sets}</p>
                      <p className="text-[11px] text-gray-500">Sets logged</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl py-2 text-center">
                      <p className="text-xl font-bold text-white">{usage.total_sessions}</p>
                      <p className="text-[11px] text-gray-500">Sessions</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Deleting will permanently remove this data from your progress charts and history.
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon="fa-solid fa-check" className="text-brand-400 text-xs" />
                  <p className="text-xs text-gray-400">No workout history — safe to delete</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!loading && (
            <div className="space-y-2">

              {/* Archive */}
              {usage?.total_sets > 0 && (
                <button
                  onClick={handleArchive}
                  disabled={working}
                  className="w-full flex items-center gap-3 bg-white/[0.05] hover:bg-white/[0.08]
                             border border-white/10 hover:border-white/20 rounded-xl px-4 py-3
                             transition-all text-left disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon="fa-solid fa-box-archive" className="text-blue-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Archive</p>
                    <p className="text-xs text-gray-500">
                      Hides from picker — history and progress stay intact
                    </p>
                  </div>
                </button>
              )}

              {/* Delete */}
              {usage?.can_delete ? (
                <button
                  onClick={handleDelete}
                  disabled={working}
                  className="w-full flex items-center gap-3 bg-red-500/10 hover:bg-red-500/15
                             border border-red-500/20 rounded-xl px-4 py-3 transition-all
                             text-left disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon="fa-solid fa-trash" className="text-red-400 text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-400">Delete permanently</p>
                    <p className="text-xs text-gray-500">No history — safe to remove</p>
                  </div>
                </button>
              ) : (
                !confirming ? (
                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full text-xs text-gray-600 hover:text-red-400 py-2 transition-colors text-center"
                  >
                    Delete anyway and lose all history →
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-xs text-red-400 font-semibold mb-1">
                      ⚠️ Are you absolutely sure?
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      This will permanently delete {usage.total_sets} sets
                      across {usage.total_sessions} sessions. This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirming(false)}
                        className="flex-1 btn-ghost text-sm py-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={working}
                        className="flex-1 btn-danger text-sm py-2"
                      >
                        Yes, delete everything
                      </button>
                    </div>
                  </div>
                )
              )}

              <button
                onClick={onClose}
                className="w-full text-center text-xs text-gray-600 hover:text-gray-400 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Exercises() {
  const { user }                        = useAuth()
  const [exercises, setExercises]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm]         = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { load() }, [showArchived])

  const load = () => {
    setLoading(true)
    exercisesApi.list({ include_archived: showArchived })
      .then(r => setExercises(r.data))
      .finally(() => setLoading(false))
  }

  const myExercises     = exercises.filter(e => e.created_by === user.id)
  const systemExercises = exercises.filter(e => !e.created_by)

  const filtered = (list) => list.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.muscle_group || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (ex) => {
    setForm({
      name:          ex.name,
      muscle_group:  ex.muscle_group || 'Chest',
      exercise_type: ex.exercise_type || 'strength',
      description:   ex.description || '',
    })
    setEditingId(ex.id)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setError('')
    setForm(EMPTY_FORM)
  }

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        const res = await exercisesApi.update(editingId, form)
        setExercises(prev => prev.map(e => e.id === editingId ? res.data : e))
      } else {
        const res = await exercisesApi.create(form)
        setExercises(prev => [...prev, res.data])
      }
      closeForm()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    try {
      await exercisesApi.archive(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to archive')
    }
  }

  const handleDelete = async (type) => {
    try {
      if (type === 'force') {
        await exercisesApi.forceDelete(deleteTarget.id)
      } else {
        await exercisesApi.delete(deleteTarget.id)
      }
      setDeleteTarget(null)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to delete')
    }
  }

  const handleUnarchive = async (id) => {
    try {
      await exercisesApi.unarchive(id)
      load()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to unarchive')
    }
  }

  return (
    <AppLayout title="Exercises" back>

      {/* Delete modal — rendered outside the card so it's not clipped */}
      {deleteTarget && (
        <DeleteModal
          exercise={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}

      {/* Search + add */}
      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
          placeholder="Search exercises…"
        />
        <button onClick={openCreate} className="btn-primary px-4 flex-shrink-0">
          <FontAwesomeIcon icon="fa-solid fa-plus" />
        </button>
      </div>

      {/* Show archived toggle */}
      <button
        onClick={() => setShowArchived(p => !p)}
        className={`text-xs px-3 py-1.5 rounded-full border mb-5 transition-all ${
          showArchived
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
            : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-400'
        }`}
      >
        <FontAwesomeIcon icon="fa-solid fa-box-archive" className="mr-1.5" />
        {showArchived ? 'Showing archived' : 'Show archived'}
      </button>

      {/* Create / Edit form */}
      {showForm && (
        <div className="card mb-5 border-brand-500/30">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-white">
              {editingId ? 'Edit Exercise' : 'New Exercise'}
            </p>
            <button onClick={closeForm} className="text-gray-500 hover:text-gray-300 p-1">
              <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field"
                placeholder="e.g. Cable Fly"
                autoFocus
              />
            </div>

            <div>
              <label className="label">Muscle Group</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MUSCLE_GROUPS.map(mg => (
                  <button
                    key={mg}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, muscle_group: mg }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border
                                transition-all duration-150 active:scale-95 ${
                      form.muscle_group === mg
                        ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/30'
                        : 'bg-white/[0.04] border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
                    }`}
                  >
                    {mg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'strength',    label: '💪 Strength'    },
                  { value: 'cardio',      label: '🏃 Cardio'      },
                  { value: 'flexibility', label: '🧘 Flexibility' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, exercise_type: value }))}
                    className={`flex-1 text-xs py-2.5 rounded-xl border transition-all
                                duration-150 active:scale-95 ${
                      form.exercise_type === value
                        ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/30'
                        : 'bg-white/[0.04] border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">
                Description
                <span className="text-gray-600 normal-case font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input-field resize-none"
                rows={2}
                placeholder="Notes about form, equipment…"
              />
            </div>

            {error && <p className="error-box">{error}</p>}

            <button onClick={save} disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Exercise'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* My custom exercises */}
          <section className="mb-6">
            <h3 className="section-title">
              My Custom Exercises ({filtered(myExercises).length})
            </h3>

            {filtered(myExercises).length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-3xl mb-2">🏋️</p>
                <p className="text-gray-400 text-sm">
                  {search
                    ? 'No custom exercises match your search'
                    : "You haven't created any exercises yet"}
                </p>
                {!search && (
                  <button
                    onClick={openCreate}
                    className="text-brand-400 text-sm mt-2 hover:text-brand-300 transition-colors"
                  >
                    Create your first one →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered(myExercises).map(ex => (
                  <div
                    key={ex.id}
                    className={`card transition-all ${ex.archived ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-sm">{ex.name}</p>
                          <span className="text-[10px] bg-brand-500/15 text-brand-400
                                           border border-brand-500/20 px-1.5 py-0.5 rounded-full">
                            Custom
                          </span>
                          {ex.archived === 1 && (
                            <span className="text-[10px] bg-blue-500/15 text-blue-400
                                             border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ex.muscle_group} · {ex.exercise_type}
                        </p>
                        {ex.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                            {ex.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {ex.archived === 1 ? (
                          <button
                            onClick={() => handleUnarchive(ex.id)}
                            className="text-xs text-blue-400 hover:text-blue-300
                                       bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5
                                       rounded-lg transition-all"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-box-open" className="text-[11px]" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openEdit(ex)}
                            className="text-xs text-gray-400 hover:text-white
                                       bg-white/5 hover:bg-white/10 px-2.5 py-1.5
                                       rounded-lg transition-all"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-pen" className="text-[11px]" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(ex)}
                          className="text-xs text-red-400 hover:text-red-300
                                     bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1.5
                                     rounded-lg transition-all"
                        >
                          <FontAwesomeIcon icon="fa-solid fa-trash" className="text-[11px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* System exercises — read only */}
          <section>
            <h3 className="section-title">
              Exercise Library ({filtered(systemExercises).length})
              <span className="text-gray-700 normal-case font-normal ml-2 text-[10px]">
                — read only
              </span>
            </h3>
            <div className="space-y-2">
              {filtered(systemExercises).map(ex => (
                <div key={ex.id} className="card flex items-center justify-between opacity-60">
                  <div>
                    <p className="font-medium text-white text-sm">{ex.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {ex.muscle_group} · {ex.exercise_type}
                    </p>
                  </div>
                  <FontAwesomeIcon icon="fa-solid fa-lock" className="text-gray-700 text-xs" />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AppLayout>
  )
}