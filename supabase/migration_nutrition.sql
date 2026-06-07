-- ================================================================
-- Migration: Nährwerte pro Zutat
-- Im Supabase SQL Editor ausführen
-- ================================================================

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS kcal_per100g   NUMERIC,
  ADD COLUMN IF NOT EXISTS protein_per100g NUMERIC,
  ADD COLUMN IF NOT EXISTS carbs_per100g  NUMERIC,
  ADD COLUMN IF NOT EXISTS fat_per100g    NUMERIC;
