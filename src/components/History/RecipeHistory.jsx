import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const DAYS      = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const DAYS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const MEALS     = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack']

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}
const fmtDate  = d => d.toISOString().split('T')[0]
const addWeeks = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n * 7); return x }

export default function RecipeHistory() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [recipes, setRecipes]     = useState([])
  const [history, setHistory]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)   // { day, meal }
  const [pickId, setPickId]       = useState('')
  const [adding, setAdding]       = useState(false)

  useEffect(() => { fetchData() }, [weekStart])

  async function fetchData() {
    setLoading(true)
    const [{ data: r }, { data: h }] = await Promise.all([
      supabase.from('recipes').select('id, name').order('name'),
      supabase.from('recipe_history')
        .select('*, recipes(name)')
        .eq('week_start', fmtDate(weekStart)),
    ])
    setRecipes(r || [])
    setHistory(h || [])
    setLoading(false)
  }

  const slotEntries = (dayIdx, meal) =>
    history.filter(h => h.day_of_week === DAYS_FULL[dayIdx] && h.meal_type === meal)

  async function addEntry() {
    if (!pickId || !modal) return
    setAdding(true)
    await supabase.from('recipe_history').insert({
      recipe_id: pickId,
      week_start: fmtDate(weekStart),
      day_of_week: DAYS_FULL[modal.day],
      meal_type: modal.meal,
    })
    setModal(null); setPickId(''); setAdding(false)
    fetchData()
  }

  async function removeEntry(eid) {
    await supabase.from('recipe_history').delete().eq('id', eid)
    fetchData()
  }

  const weekEndDisplay = new Date(addWeeks(weekStart, 1)); weekEndDisplay.setDate(weekEndDisplay.getDate() - 1)
  const opts = { day: 'numeric', month: 'short' }
  const weekLabel = `${weekStart.toLocaleDateString('de-DE', opts)} – ${weekEndDisplay.toLocaleDateString('de-DE', opts)}`
  const isThisWeek = fmtDate(weekStart) === fmtDate(getMonday(new Date()))

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1 className="page-title">Rezeptverlauf</h1>
      </div>

      <div className="week-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(p => addWeeks(p, -1))}>← Vorherige</button>
        <span className="week-label">{weekLabel}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(p => addWeeks(p, 1))}>Nächste →</button>
        {!isThisWeek && (
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(getMonday(new Date()))}>Heute</button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="history-scroll">
          <div className="history-grid">
            <div className="history-header-row">
              <div className="history-meal-col" />
              {DAYS.map((day, i) => (
                <div key={day} className="history-day-header">
                  <span className="day-abbr">{day}</span>
                  <span className="day-date">
                    {new Date(weekStart.getTime() + i * 86400000)
                      .toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>

            {MEALS.map(meal => (
              <div key={meal} className="history-meal-row">
                <div className="history-meal-label">{meal}</div>
                {DAYS.map((_, dayIdx) => {
                  const entries = slotEntries(dayIdx, meal)
                  return (
                    <div key={dayIdx} className="history-cell">
                      {entries.map(e => (
                        <div key={e.id} className="history-entry">
                          <span className="history-entry-name">{e.recipes?.name || '—'}</span>
                          <button className="history-entry-remove" onClick={() => removeEntry(e.id)} title="Entfernen">×</button>
                        </div>
                      ))}
                      <button className="history-add-btn" onClick={() => { setModal({ day: dayIdx, meal }); setPickId('') }}>+</button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{DAYS_FULL[modal.day]} · {modal.meal}</h3>
            <div className="form-group" style={{ marginTop: 18 }}>
              <label className="form-label">Rezept auswählen</label>
              <select className="form-input" value={pickId} onChange={e => setPickId(e.target.value)}>
                <option value="">– Rezept wählen –</option>
                {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Abbrechen</button>
              <button className="btn btn-accent" onClick={addEntry} disabled={!pickId || adding}>
                {adding ? '…' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
