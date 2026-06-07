import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ Ersetze 'DEIN-REPO-NAME' mit dem Namen deines GitHub Repositories
// Beispiel: wenn dein Repo 'meine-rezepte' heißt → base: '/meine-rezepte/'
export default defineConfig({
  plugins: [react()],
  base: '/recipe-tracker/',
})
