import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import { usersApi } from '../../api'

export default function FindAthletes() {
  const [all, setAll]           = useState([])
  const [linked, setLinked]     = useState(new Set())
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [pending, setPending]   = useState(new Set())

  useEffect(() => {
    Promise.all([usersApi.allAthletes(), usersApi.myAthletes()])
      .then(([all, mine]) => {
        setAll(all.data)
        setLinked(new Set(mine.data.map(a => a.id)))
      })
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (id) => {
    setPending(p => new Set(p).add(id))
    try {
      if (linked.has(id)) {
        await usersApi.unlinkAthlete(id)
        setLinked(prev => { const n = new Set(prev); n.delete(id); return n })
      } else {
        await usersApi.linkAthlete(id)
        setLinked(prev => new Set(prev).add(id))
      }
    } finally {
      setPending(p => { const n = new Set(p); n.delete(id); return n })
    }
  }

  const filtered = all.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout title="Find Athletes" back>
      <h2 className="text-xl font-bold text-white mb-1">Find Athletes</h2>
      <p className="text-gray-500 text-sm mb-5">
        Link athletes to assign routines and track their progress.
      </p>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field mb-5"
        placeholder="Search by name or email…"
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-gray-400 text-sm">
            {search ? 'No athletes match your search' : 'No athletes registered yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const isLinked = linked.has(a.id)
            const isBusy   = pending.has(a.id)
            return (
              <div key={a.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center
                                text-brand-400 font-bold text-sm flex-shrink-0 border border-brand-500/20">
                  {a.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{a.name}</p>
                  <p className="text-xs text-gray-500 truncate">{a.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isLinked && (
                    <Link
                      to={`/coach/athletes/${a.id}`}
                      className="text-xs text-brand-400 hover:text-brand-300 font-medium px-2 py-1 transition-colors"
                    >
                      View →
                    </Link>
                  )}
                  <button
                    onClick={() => toggle(a.id)}
                    disabled={isBusy}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                      isLinked
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-brand-500/20 text-brand-400 hover:bg-brand-500/30'
                    }`}
                  >
                    {isBusy ? '…' : isLinked ? 'Unlink' : '+ Link'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-gray-600 text-center mt-5">
          {linked.size} athlete{linked.size !== 1 ? 's' : ''} linked · {all.length} total registered
        </p>
      )}
    </AppLayout>
  )
}