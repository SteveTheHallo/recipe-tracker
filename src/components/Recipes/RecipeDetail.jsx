import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchRecipe() }, [id])

  async function fetchRecipe() {
    setLoading(true)
    const [{ data: r }, { data: i }, { data: s }] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', id).single(),
      supabase.from('ingredients').select('*').eq('recipe_id', id).order('sort_order'),
      supabase.from('steps').select('*').eq('recipe_id', id).order('step_number'),
    ])
    setRecipe(r)
    setIngredients(i || [])
    setSteps(s || [])
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`Rezept „${recipe.name}" wirklich löschen?`)) return
    setDeleting(true)
    await supabase.from('recipes').delete().eq('id', id)
    navigate('/rezepte')
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>
  if (!recipe) return (
    <div className="page-container">
      <p>Rezept nicht gefunden.</p>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/rezepte')}>← Zurück</button>
    </div>
  )

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
  const hasAnyMacro = recipe.calories || recipe.protein || recipe.carbs || recipe.fat

  return (
    <div className="page-container animate-fade-in">
      <div className="detail-topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/rezepte')}>
          ← Zurück
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/rezepte/${id}/bearbeiten`)}>
            ✏️ Bearbeiten
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? '…' : '🗑 Löschen'}
          </button>
        </div>
      </div>

      <div className="detail-header">
        <h1 className="detail-title">{recipe.name}</h1>
        {recipe.description && <p className="detail-description">{recipe.description}</p>}
        <div className="detail-meta">
          {recipe.prep_time && <span className="meta-chip-lg">🥢 Vorbereitung: {recipe.prep_time} Min</span>}
          {recipe.cook_time && <span className="meta-chip-lg">🔥 Kochzeit: {recipe.cook_time} Min</span>}
          {totalTime > 0 && <span className="meta-chip-lg">⏱ Gesamt: {totalTime} Min</span>}
          {recipe.servings && <span className="meta-chip-lg">👥 {recipe.servings} Portionen</span>}
        </div>
      </div>

      {hasAnyMacro && (
        <div className="detail-section">
          <h2 className="section-title">
            Nährwerte <span className="section-subtitle">pro Portion</span>
          </h2>
          <div className="macros-grid">
            {recipe.calories && (
              <div className="macro-card macro-kcal-bg">
                <div className="macro-value">{Math.round(recipe.calories)}</div>
                <div className="macro-name">kcal</div>
              </div>
            )}
            {recipe.protein && (
              <div className="macro-card macro-protein-bg">
                <div className="macro-value">{recipe.protein}g</div>
                <div className="macro-name">Protein</div>
              </div>
            )}
            {recipe.carbs && (
              <div className="macro-card macro-carbs-bg">
                <div className="macro-value">{recipe.carbs}g</div>
                <div className="macro-name">Kohlenhydrate</div>
              </div>
            )}
            {recipe.fat && (
              <div className="macro-card macro-fat-bg">
                <div className="macro-value">{recipe.fat}g</div>
                <div className="macro-name">Fett</div>
              </div>
            )}
          </div>
          {recipe.servings > 1 && recipe.calories && (
            <p className="macros-total-hint">
              Gesamt ({recipe.servings} Portionen): {Math.round(recipe.calories * recipe.servings)} kcal
              {recipe.protein ? ` · ${Math.round(recipe.protein * recipe.servings * 10) / 10}g P` : ''}
              {recipe.carbs   ? ` · ${Math.round(recipe.carbs   * recipe.servings * 10) / 10}g C` : ''}
              {recipe.fat     ? ` · ${Math.round(recipe.fat     * recipe.servings * 10) / 10}g F` : ''}
            </p>
          )}
        </div>
      )}

      {ingredients.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">Zutaten</h2>
          <div className="ingredients-list">
            {ingredients.map(ing => {
              const amt = parseFloat(ing.amount) || 0
              const ingKcal    = ing.kcal_per100g    != null ? Math.round((amt / 100) * ing.kcal_per100g    * 10) / 10 : null
              const ingProtein = ing.protein_per100g != null ? Math.round((amt / 100) * ing.protein_per100g * 10) / 10 : null
              const ingCarbs   = ing.carbs_per100g   != null ? Math.round((amt / 100) * ing.carbs_per100g   * 10) / 10 : null
              const ingFat     = ing.fat_per100g     != null ? Math.round((amt / 100) * ing.fat_per100g     * 10) / 10 : null
              const hasNutrition = ingKcal != null || ingProtein != null

              return (
                <div key={ing.id} className="ingredient-row">
                  <span className="ingredient-amount">
                    {ing.amount != null ? `${ing.amount}${ing.unit ? ' ' + ing.unit : ''}` : ''}
                  </span>
                  <span className="ingredient-name">{ing.name}</span>
                  {hasNutrition && (
                    <span className="ingredient-macros">
                      {ingKcal    != null && <span className="ing-macro-chip ing-macro-kcal">{ingKcal} kcal</span>}
                      {ingProtein != null && <span className="ing-macro-chip ing-macro-protein">{ingProtein}g P</span>}
                      {ingCarbs   != null && <span className="ing-macro-chip ing-macro-carbs">{ingCarbs}g C</span>}
                      {ingFat     != null && <span className="ing-macro-chip ing-macro-fat">{ingFat}g F</span>}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">Zubereitung</h2>
          <div className="steps-list">
            {steps.map(step => (
              <div key={step.id} className="step-row">
                <div className="step-number">{step.step_number}</div>
                <p className="step-text">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
