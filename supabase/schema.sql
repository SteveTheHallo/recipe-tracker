-- ================================================================
-- Rezept-App Datenbankschema
-- Im Supabase SQL Editor ausführen (supabase.com → SQL Editor)
-- ================================================================

-- Tabelle: recipes
CREATE TABLE public.recipes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  servings    INTEGER,
  prep_time   INTEGER,   -- Minuten
  cook_time   INTEGER,   -- Minuten
  calories    NUMERIC,   -- kcal pro Portion
  protein     NUMERIC,   -- Gramm pro Portion
  carbs       NUMERIC,   -- Gramm pro Portion
  fat         NUMERIC    -- Gramm pro Portion
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eingeloggte Nutzer können Rezepte verwalten"
  ON public.recipes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Tabelle: ingredients
CREATE TABLE public.ingredients (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id   UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  amount      NUMERIC,
  unit        TEXT,
  sort_order       INTEGER DEFAULT 0,
  kcal_per100g     NUMERIC,   -- kcal pro 100g
  protein_per100g  NUMERIC,   -- Protein pro 100g
  carbs_per100g    NUMERIC,   -- Kohlenhydrate pro 100g
  fat_per100g      NUMERIC    -- Fett pro 100g
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eingeloggte Nutzer können Zutaten verwalten"
  ON public.ingredients FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Tabelle: steps
CREATE TABLE public.steps (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id   UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL
);

ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eingeloggte Nutzer können Schritte verwalten"
  ON public.steps FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Tabelle: recipe_history
CREATE TABLE public.recipe_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  recipe_id   UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  added_by    UUID REFERENCES auth.users(id),
  week_start  DATE NOT NULL,   -- Montag der Woche (YYYY-MM-DD)
  day_of_week TEXT,            -- 'Montag', 'Dienstag', ...
  meal_type   TEXT             -- 'Frühstück', 'Mittagessen', 'Abendessen', 'Snack'
);

ALTER TABLE public.recipe_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eingeloggte Nutzer können Verlauf verwalten"
  ON public.recipe_history FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Automatisch updated_at aktualisieren
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
