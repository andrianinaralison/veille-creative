import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Dashboard from './pages/Dashboard'
import LibraryPage from './pages/LibraryPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectCreate from './pages/ProjectCreate'
import ProjectDetail from './pages/ProjectDetail'
import MoodboardBuilder from './pages/MoodboardBuilder'
import CategoryPage from './pages/CategoryPage'
import DigestPage from './pages/DigestPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import RequireAuth from './components/RequireAuth'
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import CurationPage from './pages/admin/CurationPage'
import ReferencesAdminPage from './pages/admin/ReferencesAdminPage'
import SectionsAdminPage from './pages/admin/SectionsAdminPage'
import DigestAdminPage from './pages/admin/DigestAdminPage'

// Pages that use the full sidebar layout — réservées aux utilisateurs connectés (180-16)
const withLayout = (Component) => (
  <RequireAuth>
    <Layout>
      <Component />
    </Layout>
  </RequireAuth>
)

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ── Auth utilisateurs ── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ── Espace Léa (authentifié) ── */}
        <Route path="/" element={withLayout(Dashboard)} />
        <Route path="/library" element={withLayout(LibraryPage)} />
        <Route path="/library/section/:id" element={withLayout(CategoryPage)} />
        <Route path="/projects" element={withLayout(ProjectsPage)} />
        <Route path="/projects/new" element={withLayout(ProjectCreate)} />
        <Route path="/projects/:id" element={withLayout(ProjectDetail)} />
        {/* Digest éditorial (180-19) */}
        <Route path="/digest" element={withLayout(DigestPage)} />
        <Route path="/digest/:id" element={withLayout(DigestPage)} />
        <Route path="/surprises" element={<Navigate to="/" replace />} />
        {/* Moodboard gets full screen — no sidebar */}
        <Route path="/projects/:id/moodboard" element={<RequireAuth><MoodboardBuilder /></RequireAuth>} />

        {/* ── Routes admin ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/curation" replace />} />
          <Route path="curation" element={<CurationPage />} />
          <Route path="references" element={<ReferencesAdminPage />} />
          <Route path="sections" element={<SectionsAdminPage />} />
          <Route path="digest" element={<DigestAdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
