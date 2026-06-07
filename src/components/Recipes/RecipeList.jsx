import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import RecipeCard from './RecipeCard'

export default function RecipeList() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchRecipes()
  }, [])

  async function fetchRecipes() {
    setLoading(true)
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .order('name')
    setRecipes(data || [])
    setLoading(false)
  }

  const filtered = recipes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Rezepte</h1>
        <button className="btn btn-accent" onClick={() => navigate('/rezepte/neu')}>
          + Neues Rezept
        </button>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Rezepte durchsuchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{search ? '🔍' : '🍽️'}</div>
          <h3>{search ? 'Keine Rezepte gefunden' : 'Noch keine Rezepte'}</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            {search ? `Kein Treffer für „${search}"` : 'Füge dein erstes Rezept hinzu!'}
          </p>
          {!search && (
            <button
              className="btn btn-accent"
              style={{ marginTop: 20 }}
              onClick={() => navigate('/rezepte/neu')}
            >
              Erstes Rezept erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => navigate(`/rezepte/${recipe.id}`)}
            />
          ))}
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <p className="recipe-count">
          {filtered.length} von {recipes.length} Rezept{recipes.length !== 1 ? 'en' : ''}
        </p>
      )}
    </div>
  )
}
