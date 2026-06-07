export default function RecipeCard({ recipe, onClick }) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
  const hasAnyMacro = recipe.calories || recipe.protein || recipe.carbs || recipe.fat

  return (
    <div className="recipe-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="recipe-card-body">
        <div className="recipe-card-meta">
          {totalTime > 0 && <span className="meta-chip">⏱ {totalTime} Min</span>}
          {recipe.servings && <span className="meta-chip">👥 {recipe.servings} Port.</span>}
        </div>
        <h3 className="recipe-card-title">{recipe.name}</h3>
        {recipe.description && (
          <p className="recipe-card-desc">{recipe.description}</p>
        )}
        {hasAnyMacro && (
          <div className="macro-chips" style={{ marginTop: 14 }}>
            {recipe.calories && (
              <span className="macro-chip macro-kcal">
                <span className="macro-chip-label">kcal</span>
                {Math.round(recipe.calories)}
              </span>
            )}
            {recipe.protein && (
              <span className="macro-chip macro-protein">
                <span className="macro-chip-label">P</span>
                {recipe.protein}g
              </span>
            )}
            {recipe.carbs && (
              <span className="macro-chip macro-carbs">
                <span className="macro-chip-label">K</span>
                {recipe.carbs}g
              </span>
            )}
            {recipe.fat && (
              <span className="macro-chip macro-fat">
                <span className="macro-chip-label">F</span>
                {recipe.fat}g
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
