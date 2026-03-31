import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DigestPage from './pages/DigestPage'
import LibraryPage from './pages/LibraryPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectCreate from './pages/ProjectCreate'
import ProjectDetail from './pages/ProjectDetail'
import MoodboardBuilder from './pages/MoodboardBuilder'
import SurprisesPage from './pages/SurprisesPage'

// Pages that use the full sidebar layout
const withLayout = (Component) => (
  <Layout>
    <Component />
  </Layout>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={withLayout(LibraryPage)} />
        <Route path="/digest" element={withLayout(DigestPage)} />
        <Route path="/library" element={withLayout(LibraryPage)} />
        <Route path="/projects" element={withLayout(ProjectsPage)} />
        <Route path="/projects/new" element={withLayout(ProjectCreate)} />
        <Route path="/projects/:id" element={withLayout(ProjectDetail)} />
        <Route path="/surprises" element={withLayout(SurprisesPage)} />
        {/* Moodboard gets full screen — no sidebar */}
        <Route path="/projects/:id/moodboard" element={<MoodboardBuilder />} />
      </Routes>
    </BrowserRouter>
  )
}
