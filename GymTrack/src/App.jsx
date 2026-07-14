import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Login    from './pages/Login'
import Register from './pages/Register'

// Athlete pages
import AthleteDashboard     from './pages/athlete/Dashboard'
import LogSession           from './pages/athlete/LogSession'
import History              from './pages/athlete/History'
import Progress             from './pages/athlete/Progress'
import AthleteRoutineBuilder from './pages/athlete/RoutineBuilder'
import SessionDetail from './pages/athlete/SessionDetail'
import RoutineDetail from './pages/athlete/RoutineDetail'

// Coach pages
import CoachDashboard  from './pages/coach/Dashboard'
import RoutineBuilder  from './pages/coach/RoutineBuilder'
import FindAthletes    from './pages/coach/FindAthletes'
import AthleteDetail   from './pages/coach/AthleteDetail'
import ResumeSession from './pages/athlete/ResumeSession'
function Guard({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role)
    return <Navigate to={user.role === 'coach' ? '/coach' : '/'} replace />
  return children
}

export default function App() {
  const { user } = useAuth()
  const home = user?.role === 'coach' ? '/coach' : '/'

  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to={home} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={home} /> : <Register />} />

      {/* Athlete */}
      <Route path="/"              element={<Guard role="athlete"><AthleteDashboard /></Guard>} />
      <Route path="/log"           element={<Guard role="athlete"><LogSession /></Guard>} />
      <Route path="/history"       element={<Guard role="athlete"><History /></Guard>} />
      <Route path="/progress"      element={<Guard role="athlete"><Progress /></Guard>} />
      <Route path="/routines/new"  element={<Guard role="athlete"><AthleteRoutineBuilder /></Guard>} />
      <Route path="/log/resume/:sessionId" element={<Guard role="athlete"><ResumeSession /></Guard>} />
      <Route path="/history/:sessionId" element={<Guard role="athlete"><SessionDetail /></Guard>} />
      <Route path="/routines/:id/edit"   element={<Guard role="athlete"><AthleteRoutineBuilder /></Guard>} />
      <Route path="/routines/:id" element={<Guard role="athlete"><RoutineDetail /></Guard>} />
      {/* Coach */}
      <Route path="/coach"                     element={<Guard role="coach"><CoachDashboard /></Guard>} />
      <Route path="/coach/routines/new"        element={<Guard role="coach"><RoutineBuilder /></Guard>} />
      <Route path="/coach/routines/:id/edit"   element={<Guard role="coach"><RoutineBuilder /></Guard>} />
      <Route path="/athletes"                  element={<Guard role="coach"><FindAthletes /></Guard>} />
      <Route path="/coach/athletes/:athleteId" element={<Guard role="coach"><AthleteDetail /></Guard>} />

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}