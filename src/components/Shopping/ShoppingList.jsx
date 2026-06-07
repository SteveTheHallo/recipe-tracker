import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

function fmtAmount(n) {
  if (n == null) return ''
  return Number.isInteger(n) ? n : Math.round(n * 100) / 100
}

export default function ShoppingList() {
  const [recipes, setRecipes]           = useState([])
  const [selectedIds, setSelectedIds]   = useState([])
  const [shoppingItems, setShoppingItems] = useState([])
  const [checked, setChecked]           = useState({})
  const [loading, setLoading]           = useState(true)
  const [generating, setGenerating]     = useState(false)

  useEffect(() => { fetchRecipes() }, [])

  async function fetchRecipes() {
    const { data } = await supabase.from('recipes').select('id, name').order('name')
    setRecipes(data || [])
    setLoading(false)
  }

  const toggleRecipe = id =>
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  async function generateList() {
    if (!selectedIds.length) return
    setGenerating(true)
    const { data: ings } = await supabase
      .from('ingredients')
      .select('name, amount, unit, recipe_id')
      .in('recipe_id', selectedIds)

    const agg = {}
    for (const ing of (ings || [])) {
      const key = `${ing.name.toLowerCase().trim()}__${(ing.unit || '').toLowerCase().trim()}`
      if (agg[key]) {
        if (ing.amount != null) agg[key].amount = (agg[key].amount || 0) + ing.amount
      } else {
        agg[key] = { name: ing.name, amount: ing.amount, unit: ing.unit }
      }
    }
    const items = Object.values(agg).sort((a, b) => a.name.localeCompare(b.name, 'de'))
    setShoppingItems(items)
    setChecked({})
    setGenerating(false)
  }

  const [allDone, setAllDone] = useState(false)
  const clearTimer = useRef(null)

  const toggleChecked = idx => setChecked(p => ({ ...p, [idx]: !p[idx] }))
  const clearAll = () => { setShoppingItems([]); setChecked({}); setSelectedIds([]); setAllDone(false) }

  const doneCount = Object.values(checked).filter(Boolean).length

  // Automatisch leeren wenn alles abgehakt ist
  useEffect(() => {
    if (shoppingItems.length > 0 && doneCount === shoppingItems.length) {
      setAllDone(true)
      clearTimer.current = setTimeout(() => {
        clearAll()
      }, 2200)
    }
    return () => clearTimeout(clearTimer.current)
  }, [doneCount, shoppingItems.length])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Einkaufsliste</h1>
        {shoppingItems.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>↺ Neu starten</button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Rezepte auswählen</h2>
            {recipes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Noch keine Rezepte vorhanden. Lege zuerst Rezepte an.</p>
            ) : (
              <div className="recipe-selector-grid">
                {recipes.map(r => {
                  const sel = selectedIds.includes(r.id)
                  return (
                    <button
                      type="button"
                      key={r.id}
                      className={`recipe-selector-item${sel ? ' selected' : ''}`}
                      onClick={() => toggleRecipe(r.id)}
                    >
                      <span className="selector-check">{sel ? '✓' : ''}</span>
                      <span>{r.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            <button
              className="btn btn-accent"
              onClick={generateList}
              disabled={!selectedIds.length || generating}
              style={{ marginTop: 18 }}
            >
              {generating ? '…' : `🛒 Liste erstellen (${selectedIds.length} Rezept${selectedIds.length !== 1 ? 'e' : ''})`}
            </button>
          </div>

          {shoppingItems.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              {allDone && (
                <div className="shopping-all-done">
                  🎉 Alles eingekauft! Die Liste wird geleert…
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 className="section-title">Deine Liste</h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {doneCount} / {shoppingItems.length} erledigt
                </span>
              </div>
              <div className="shopping-items">
                {shoppingItems.map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`shopping-item${checked[idx] ? ' checked' : ''}`}
                    onClick={() => toggleChecked(idx)}
                  >
                    <span className={`shopping-checkbox${checked[idx] ? ' shopping-checkbox-checked' : ''}`}>
                      {checked[idx] && '✓'}
                    </span>
                    <span className="shopping-item-name">{item.name}</span>
                    {(item.amount != null || item.unit) && (
                      <span className="shopping-item-amount">
                        {fmtAmount(item.amount)}{item.unit ? ` ${item.unit}` : ''}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-light)' }}>
                Tippe auf einen Artikel, um ihn abzuhaken.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
