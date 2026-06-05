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
import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import CurationPage from './pages/admin/CurationPage'
import ReferencesAdminPage from './pages/admin/ReferencesAdminPage'
import SectionsAdminPage from './pages/admin/SectionsAdminPage'

// Pages that use the full sidebar layout
const withLayout = (Component) => (
  <Layout>
    <Component />
  </Layout>
)

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* ── Routes publiques ── */}
        <Route path="/" element={withLayout(LibraryPage)} />
        <Route path="/library" element={withLayout(LibraryPage)} />
        <Route path="/library/section/:id" element={withLayout(CategoryPage)} />
        <Route path="/projects" element={withLayout(ProjectsPage)} />
        <Route path="/projects/new" element={withLayout(ProjectCreate)} />
        <Route path="/projects/:id" element={withLayout(ProjectDetail)} />
        {/* /digest et /surprises : retirées — Digest = v0.6, Surprises = abandonné */}
        <Route path="/digest" element={<Navigate to="/" replace />} />
        <Route path="/surprises" element={<Navigate to="/" replace />} />
        {/* Moodboard gets full screen — no sidebar */}
        <Route path="/projects/:id/moodboard" element={<MoodboardBuilder />} />

        {/* ── Routes admin ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/curation" replace />} />
          <Route path="curation" element={<CurationPage />} />
          <Route path="references" element={<ReferencesAdminPage />} />
          <Route path="sections" element={<SectionsAdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
