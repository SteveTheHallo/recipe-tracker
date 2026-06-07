import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function fmtAmount(n) {
  if (n == null) return ''
  return Number.isInteger(n) ? n : Math.round(n * 100) / 100
}

export default function ShoppingList() {
  const [recipes, setRecipes]       = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [groups, setGroups]         = useState([])   // [{ recipeId, recipeName, items: [{_id, name, amount, unit, checked}] }]
  const [manualItems, setManualItems] = useState([]) // [{ _id, name, checked }]
  const [manualInput, setManualInput] = useState('')
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)

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
      .order('sort_order')

    // Gruppieren nach Rezept (Reihenfolge der selectedIds beibehalten)
    const grouped = selectedIds.map(rid => {
      const recipe = recipes.find(r => r.id === rid)
      const items = (ings || [])
        .filter(i => i.recipe_id === rid)
        .map(i => ({ _id: crypto.randomUUID(), name: i.name, amount: i.amount, unit: i.unit, checked: false }))
      return { recipeId: rid, recipeName: recipe?.name || '', items }
    }).filter(g => g.items.length > 0)

    setGroups(grouped)
    setManualItems([])
    setGenerating(false)
  }

  // Zutat in Gruppe abhaken
  const toggleGroupItem = (recipeId, itemId) => {
    setGroups(prev => prev.map(g =>
      g.recipeId !== recipeId ? g :
      { ...g, items: g.items.map(i => i._id === itemId ? { ...i, checked: !i.checked } : i) }
    ))
  }

  // Manuellen Eintrag abhaken
  const toggleManual = id =>
    setManualItems(prev => prev.map(i => i._id === id ? { ...i, checked: !i.checked } : i))

  // Manuellen Eintrag hinzufügen
  const addManual = () => {
    const val = manualInput.trim()
    if (!val) return
    setManualItems(prev => [...prev, { _id: crypto.randomUUID(), name: val, checked: false }])
    setManualInput('')
  }

  // Manuellen Eintrag entfernen
  const removeManual = id =>
    setManualItems(prev => prev.filter(i => i._id !== id))

  // Alles leeren
  const clearAll = () => { setGroups([]); setManualItems([]); setSelectedIds([]) }

  // Gesamtzählung
  const allItems    = [...groups.flatMap(g => g.items), ...manualItems]
  const totalCount  = allItems.length
  const doneCount   = allItems.filter(i => i.checked).length
  const allDone     = totalCount > 0 && doneCount === totalCount
  const hasList     = groups.length > 0 || manualItems.length > 0

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Einkaufsliste</h1>
        {hasList && allDone && (
          <button className="btn btn-danger btn-sm" onClick={clearAll}>🗑 Liste leeren</button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          {/* Rezepte auswählen */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Rezepte auswählen</h2>
            {recipes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Noch keine Rezepte vorhanden.</p>
            ) : (
              <div className="recipe-selector-grid">
                {recipes.map(r => {
                  const sel = selectedIds.includes(r.id)
                  return (
                    <button type="button" key={r.id}
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

          {/* Einkaufsliste */}
          {hasList && (
            <div className="card" style={{ padding: 24 }}>

              {/* Fortschritt */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 className="section-title" style={{ margin: 0 }}>Deine Liste</h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {doneCount} / {totalCount} erledigt
                </span>
              </div>

              {/* Gruppen pro Rezept */}
              {groups.map(group => (
                <div key={group.recipeId} className="shopping-group">
                  <div className="shopping-group-title">{group.recipeName}</div>
                  <div className="shopping-items">
                    {group.items.map(item => (
                      <button type="button" key={item._id}
                        className={`shopping-item${item.checked ? ' checked' : ''}`}
                        onClick={() => toggleGroupItem(group.recipeId, item._id)}
                      >
                        <span className={`shopping-checkbox${item.checked ? ' shopping-checkbox-checked' : ''}`}>
                          {item.checked && '✓'}
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
                </div>
              ))}

              {/* Manuell-Gruppe */}
              <div className="shopping-group">
                <div className="shopping-group-title">Manuell</div>

                {/* Eingabe */}
                <div className="manual-input-row">
                  <input
                    className="form-input"
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addManual()}
                    placeholder="Zutat hinzufügen…"
                  />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addManual}>+ Hinzufügen</button>
                </div>

                {manualItems.length > 0 && (
                  <div className="shopping-items" style={{ marginTop: 8 }}>
                    {manualItems.map(item => (
                      <div key={item._id} className="shopping-item-row">
                        <button type="button"
                          className={`shopping-item${item.checked ? ' checked' : ''}`}
                          style={{ flex: 1 }}
                          onClick={() => toggleManual(item._id)}
                        >
                          <span className={`shopping-checkbox${item.checked ? ' shopping-checkbox-checked' : ''}`}>
                            {item.checked && '✓'}
                          </span>
                          <span className="shopping-item-name">{item.name}</span>
                        </button>
                        <button type="button" className="remove-manual-btn" onClick={() => removeManual(item._id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {manualItems.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>Noch keine manuellen Einträge.</p>
                )}
              </div>

              {allDone && (
                <div className="shopping-all-done" style={{ marginTop: 20 }}>
                  🎉 Alles eingekauft! Du kannst die Liste jetzt leeren.
                </div>
              )}

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
