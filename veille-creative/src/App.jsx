import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Dashboard from './pages/Dashboard'
import DigestPage from './pages/DigestPage'
import LibraryPage from './pages/LibraryPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectCreate from './pages/ProjectCreate'
import ProjectDetail from './pages/ProjectDetail'
import MoodboardBuilder from './pages/MoodboardBuilder'
import SurprisesPage from './pages/SurprisesPage'
import CategoryPage from './pages/CategoryPage'
import AdminLayout from './pages/admin/AdminLayout'
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
        <Route path="/digest" element={withLayout(DigestPage)} />
        <Route path="/library" element={withLayout(LibraryPage)} />
        <Route path="/library/section/:id" element={withLayout(CategoryPage)} />
        <Route path="/projects" element={withLayout(ProjectsPage)} />
        <Route path="/projects/new" element={withLayout(ProjectCreate)} />
        <Route path="/projects/:id" element={withLayout(ProjectDetail)} />
        <Route path="/surprises" element={withLayout(SurprisesPage)} />
        {/* Moodboard gets full screen — no sidebar */}
        <Route path="/projects/:id/moodboard" element={<MoodboardBuilder />} />

        {/* ── Routes admin ── */}
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
