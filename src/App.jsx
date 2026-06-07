import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Auth/Login'
import Layout from './components/Layout/Layout'
import RecipeList from './components/Recipes/RecipeList'
import RecipeDetail from './components/Recipes/RecipeDetail'
import RecipeForm from './components/Recipes/RecipeForm'
import ShoppingList from './components/Shopping/ShoppingList'
import RecipeHistory from './components/History/RecipeHistory'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/rezepte" replace />} />
              <Route path="/rezepte" element={<RecipeList />} />
              <Route path="/rezepte/neu" element={<RecipeForm />} />
              <Route path="/rezepte/:id" element={<RecipeDetail />} />
              <Route path="/rezepte/:id/bearbeiten" element={<RecipeForm />} />
              <Route path="/einkaufsliste" element={<ShoppingList />} />
              <Route path="/verlauf" element={<RecipeHistory />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/rezepte" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
