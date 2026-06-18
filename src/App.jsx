import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ClientDashboard from './pages/ClientDashboard'
import TechnicianDashboard from './pages/TechnicianDashboard'
import AdminDashboard from './pages/AdminDashboard'
import RequestDetails from './pages/RequestDetails'
import VisitDetails from './pages/VisitDetails'
import AuthCallback from './pages/AuthCallback'
import TechnicianSearch from './pages/TechnicianSearch'
import ProtectedRoute from './components/ProtectedRoute'
import Toast from './components/Toast'
import { useToast } from './hooks/useToast'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  const { toast } = useToast()

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/request/:id" element={<RequestDetails />} />
            <Route path="/client/visit/:id" element={<VisitDetails />} />
            <Route path="/client/search" element={<TechnicianSearch />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
            <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
            <Route path="/technician/visit/:id" element={<VisitDetails />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
        <Toast toast={toast} />
      </Router>
    </AuthProvider>
  )
}


