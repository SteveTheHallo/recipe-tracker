import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const newIng = () => ({
  _id: crypto.randomUUID(),
  name: '', amount: '', unit: '',
  kcal_per100g: '', protein_per100g: '', carbs_per100g: '', fat_per100g: '',
  nutritionOpen: false,
})
const newStep = () => ({ _id: crypto.randomUUID(), description: '' })

const emptyForm = {
  name: '', description: '', servings: '', prep_time: '', cook_time: '',
  calories: '', protein: '', carbs: '', fat: '',
}

function calcAutoNutrition(ingredients, servings) {
  let kcal = 0, prot = 0, carb = 0, fat = 0, hasAny = false
  for (const ing of ingredients) {
    const amt = parseFloat(ing.amount) || 0
    const k   = parseFloat(ing.kcal_per100g) || 0
    const p   = parseFloat(ing.protein_per100g) || 0
    const c   = parseFloat(ing.carbs_per100g) || 0
    const f   = parseFloat(ing.fat_per100g) || 0
    if (k || p || c || f) hasAny = true
    kcal += (amt / 100) * k
    prot += (amt / 100) * p
    carb += (amt / 100) * c
    fat  += (amt / 100) * f
  }
  if (!hasAny) return null
  const srv = Math.max(1, parseInt(servings) || 1)
  const r = v => Math.round(v / srv * 10) / 10
  return { calories: r(kcal), protein: r(prot), carbs: r(carb), fat: r(fat) }
}

export default function RecipeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm]               = useState(emptyForm)
  const [ingredients, setIngredients] = useState([newIng()])
  const [steps, setSteps]             = useState([newStep()])
  const [loading, setLoading]         = useState(isEdit)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [autoMode, setAutoMode]       = useState(true)   // true = auto-berechnet, false = manuell

  // Auto-Berechnung
  const auto = calcAutoNutrition(ingredients, form.servings)

  // Wechsel von auto → manuell: aktuell berechnete Werte übernehmen
  const switchToManual = useCallback(() => {
    if (auto) {
      setForm(p => ({
        ...p,
        calories: String(auto.calories),
        protein:  String(auto.protein),
        carbs:    String(auto.carbs),
        fat:      String(auto.fat),
      }))
    }
    setAutoMode(false)
  }, [auto])

  useEffect(() => { if (isEdit) fetchRecipeData() }, [id])

  async function fetchRecipeData() {
    setLoading(true)
    const [{ data: r }, { data: i }, { data: s }] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', id).single(),
      supabase.from('ingredients').select('*').eq('recipe_id', id).order('sort_order'),
      supabase.from('steps').select('*').eq('recipe_id', id).order('step_number'),
    ])
    if (r) {
      setForm({
        name: r.name || '', description: r.description || '',
        servings: r.servings ?? '', prep_time: r.prep_time ?? '',
        cook_time: r.cook_time ?? '', calories: r.calories ?? '',
        protein: r.protein ?? '', carbs: r.carbs ?? '', fat: r.fat ?? '',
      })
    }
    if (i?.length) {
      setIngredients(i.map(x => ({
        _id: x.id, name: x.name, amount: x.amount ?? '', unit: x.unit ?? '',
        kcal_per100g: x.kcal_per100g ?? '', protein_per100g: x.protein_per100g ?? '',
        carbs_per100g: x.carbs_per100g ?? '', fat_per100g: x.fat_per100g ?? '',
        nutritionOpen: !!(x.kcal_per100g || x.protein_per100g || x.carbs_per100g || x.fat_per100g),
      })))
      // Wenn Zutaten Nährwerte haben → Auto-Modus
      const hasNutrition = i.some(x => x.kcal_per100g || x.protein_per100g)
      setAutoMode(hasNutrition)
    }
    if (s?.length) setSteps(s.map(x => ({ _id: x.id, description: x.description })))
    setLoading(false)
  }

  const setF      = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const addIng    = () => setIngredients(p => [...p, newIng()])
  const rmIng     = _id => setIngredients(p => p.filter(x => x._id !== _id))
  const setIng    = (_id, k, v) => setIngredients(p => p.map(x => x._id === _id ? { ...x, [k]: v } : x))
  const toggleNutrition = _id => setIngredients(p => p.map(x => x._id === _id ? { ...x, nutritionOpen: !x.nutritionOpen } : x))
  const addStep   = () => setSteps(p => [...p, newStep()])
  const rmStep    = _id => setSteps(p => p.filter(x => x._id !== _id))
  const setStep   = (_id, v) => setSteps(p => p.map(x => x._id === _id ? { ...x, description: v } : x))

  // Aktive Nährwerte (auto oder manuell)
  const displayNutrition = autoMode && auto ? auto : {
    calories: form.calories, protein: form.protein, carbs: form.carbs, fat: form.fat,
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name ist erforderlich.'); return }
    setSaving(true); setError('')

    const finalNutrition = autoMode && auto ? auto : {
      calories: form.calories ? +form.calories : null,
      protein:  form.protein  ? +form.protein  : null,
      carbs:    form.carbs    ? +form.carbs    : null,
      fat:      form.fat      ? +form.fat      : null,
    }

    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      servings:    form.servings  ? +form.servings  : null,
      prep_time:   form.prep_time ? +form.prep_time : null,
      cook_time:   form.cook_time ? +form.cook_time : null,
      calories:    finalNutrition.calories,
      protein:     finalNutrition.protein,
      carbs:       finalNutrition.carbs,
      fat:         finalNutrition.fat,
      updated_at:  new Date().toISOString(),
    }

    let recipeId = id
    if (isEdit) {
      const { error: err } = await supabase.from('recipes').update(payload).eq('id', id)
      if (err) { setError('Fehler beim Speichern: ' + err.message); setSaving(false); return }
    } else {
      const { data, error: err } = await supabase.from('recipes').insert(payload).select().single()
      if (err || !data) { setError('Fehler beim Erstellen: ' + (err?.message || '')); setSaving(false); return }
      recipeId = data.id
    }

    await Promise.all([
      supabase.from('ingredients').delete().eq('recipe_id', recipeId),
      supabase.from('steps').delete().eq('recipe_id', recipeId),
    ])

    const validIngs  = ingredients.filter(x => x.name.trim())
    const validSteps = steps.filter(x => x.description.trim())

    await Promise.all([
      validIngs.length && supabase.from('ingredients').insert(
        validIngs.map((x, i) => ({
          recipe_id: recipeId,
          name:      x.name.trim(),
          amount:    x.amount ? +x.amount : null,
          unit:      x.unit.trim() || null,
          sort_order: i,
          kcal_per100g:    x.kcal_per100g    !== '' ? +x.kcal_per100g    : null,
          protein_per100g: x.protein_per100g !== '' ? +x.protein_per100g : null,
          carbs_per100g:   x.carbs_per100g   !== '' ? +x.carbs_per100g   : null,
          fat_per100g:     x.fat_per100g     !== '' ? +x.fat_per100g     : null,
        }))
      ),
      validSteps.length && supabase.from('steps').insert(
        validSteps.map((x, i) => ({ recipe_id: recipeId, step_number: i + 1, description: x.description.trim() }))
      ),
    ])

    navigate(`/rezepte/${recipeId}`)
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Rezept bearbeiten' : 'Neues Rezept'}</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>✕ Abbrechen</button>
      </div>

      <form onSubmit={handleSubmit} className="recipe-form">
        {error && <div className="form-error">{error}</div>}

        {/* Allgemeines */}
        <div className="form-section">
          <h2 className="form-section-title">Allgemeines</h2>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="z.B. Spaghetti Carbonara" required />
          </div>
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-input form-textarea" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Kurze Beschreibung…" />
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Portionen</label>
              <input className="form-input" type="number" min="1" value={form.servings} onChange={e => setF('servings', e.target.value)} placeholder="4" />
            </div>
            <div className="form-group">
              <label className="form-label">Vorbereitung (Min)</label>
              <input className="form-input" type="number" min="0" value={form.prep_time} onChange={e => setF('prep_time', e.target.value)} placeholder="15" />
            </div>
            <div className="form-group">
              <label className="form-label">Kochzeit (Min)</label>
              <input className="form-input" type="number" min="0" value={form.cook_time} onChange={e => setF('cook_time', e.target.value)} placeholder="30" />
            </div>
          </div>
        </div>

        {/* Zutaten */}
        <div className="form-section">
          <h2 className="form-section-title">Zutaten</h2>
          <div className="dynamic-list">
            {ingredients.map((ing, idx) => (
              <div key={ing._id} className="ing-wrapper">
                {/* Hauptzeile */}
                <div className="dynamic-row">
                  <input
                    className="form-input" style={{ flex: 1 }}
                    value={ing.name} onChange={e => setIng(ing._id, 'name', e.target.value)}
                    placeholder={`Zutat ${idx + 1}`}
                  />
                  <input
                    className="form-input" style={{ width: 80 }}
                    type="number" min="0" step="any"
                    value={ing.amount} onChange={e => setIng(ing._id, 'amount', e.target.value)}
                    placeholder="Menge"
                  />
                  <input
                    className="form-input" style={{ width: 68 }}
                    value={ing.unit} onChange={e => setIng(ing._id, 'unit', e.target.value)}
                    placeholder="g / ml"
                  />
                  <button
                    type="button"
                    className={`nutrition-toggle-btn ${ing.nutritionOpen ? 'nutrition-toggle-active' : ''}`}
                    onClick={() => toggleNutrition(ing._id)}
                    title="Nährwerte pro 100g eingeben"
                  >
                    🧬
                  </button>
                  {ingredients.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => rmIng(ing._id)}>✕</button>
                  )}
                </div>

                {/* Nährwerte-Zeile (aufklappbar) */}
                {ing.nutritionOpen && (
                  <div className="ing-nutrition-row">
                    <span className="ing-nutrition-label">pro 100g:</span>
                    {[
                      ['kcal_per100g', 'kcal', '#B0531F'],
                      ['protein_per100g', 'Protein g', '#2C5F2E'],
                      ['carbs_per100g', 'Carbs g', '#9A6B12'],
                      ['fat_per100g', 'Fett g', '#3B3A8C'],
                    ].map(([field, label, color]) => (
                      <div key={field} className="ing-nutrition-field">
                        <label className="ing-nutrition-fieldlabel" style={{ color }}>{label}</label>
                        <input
                          className="form-input ing-nutrition-input"
                          type="number" min="0" step="0.1"
                          value={ing[field]}
                          onChange={e => setIng(ing._id, field, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm add-btn" onClick={addIng}>+ Zutat hinzufügen</button>
        </div>

        {/* Nährwerte */}
        <div className="form-section">
          <div className="nutrition-section-header">
            <h2 className="form-section-title" style={{ margin: 0 }}>
              Nährwerte <span className="form-section-subtitle">pro Portion</span>
            </h2>
            {autoMode ? (
              <div className="nutrition-mode-badge">
                <span className="auto-badge">✨ Auto-berechnet</span>
                <button type="button" className="nutrition-override-btn" onClick={switchToManual}>
                  Manuell überschreiben
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="nutrition-override-btn"
                onClick={() => { setAutoMode(true) }}
              >
                ↩ Zurück zu Auto
              </button>
            )}
          </div>

          {autoMode && !auto && (
            <p className="nutrition-hint">
              Trage bei den Zutaten Nährwerte pro 100g ein (🧬-Symbol) — die Gesamtwerte werden automatisch berechnet.
            </p>
          )}

          {autoMode && auto && !form.servings && (
            <p className="nutrition-warning">
              ⚠️ Keine Portionsanzahl angegeben — es wird durch 1 geteilt (= Gesamtwert). Trage oben die Anzahl Portionen ein.
            </p>
          )}

          {autoMode && auto && (() => {
            const total = calcAutoNutrition(ingredients, 1)
            const srv = Math.max(1, parseInt(form.servings) || 1)
            if (!total || srv === 1) return null
            return (
              <p className="nutrition-hint">
                Gesamt: <strong>{total.calories} kcal</strong> ÷ {srv} Portionen = <strong>{auto.calories} kcal / Portion</strong>
              </p>
            )
          })()}

          <div className="form-row-4" style={{ marginTop: 14 }}>
            {[
              ['calories', 'kcal', '500'],
              ['protein',  'Protein (g)', '30'],
              ['carbs',    'Kohlenhydrate (g)', '45'],
              ['fat',      'Fett (g)', '20'],
            ].map(([k, l, ph]) => (
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <input
                  className={`form-input ${autoMode && auto ? 'input-auto' : ''}`}
                  type="number" min="0" step="0.1"
                  value={autoMode && auto ? displayNutrition[k] : form[k]}
                  onChange={e => !autoMode && setF(k, e.target.value)}
                  readOnly={autoMode && !!auto}
                  placeholder={ph}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Schritte */}
        <div className="form-section">
          <h2 className="form-section-title">Zubereitung</h2>
          <div className="dynamic-list">
            {steps.map((step, idx) => (
              <div key={step._id} className="dynamic-row step-dynamic-row">
                <div className="step-number-badge">{idx + 1}</div>
                <textarea
                  className="form-input form-textarea"
                  style={{ flex: 1, minHeight: 64 }}
                  value={step.description}
                  onChange={e => setStep(step._id, e.target.value)}
                  placeholder={`Schritt ${idx + 1} beschreiben…`}
                />
                {steps.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => rmStep(step._id)}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm add-btn" onClick={addStep}>+ Schritt hinzufügen</button>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Abbrechen</button>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Speichern…</>
              : (isEdit ? '✓ Änderungen speichern' : '✓ Rezept erstellen')
            }
          </button>
        </div>
      </form>
    </div>
  )
}
