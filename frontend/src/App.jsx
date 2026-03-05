import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import PowerScaleGatewayPage from './pages/PowerScaleGatewayPage'
import SearchPage from './pages/SearchPage'
import ReviewCartPage from './pages/ReviewCartPage'
import ContributePage from './pages/ContributePage'
import SettingDetailPage from './pages/SettingDetailPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifiedPage from './pages/VerifiedPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminSettingsPage from './pages/AdminSettingsPage'

const queryClient = new QueryClient()

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Restore session from cookie on app load
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  const login = (userData) => {
    setUser(userData)
  }

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .finally(() => setUser(null))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ls-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-ls-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ls-text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-ls-dark">
          <Sidebar user={user} onLogout={logout} />
          <div className="lg:ml-64">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/powerscale" element={user ? <Navigate to="/search" /> : <PowerScaleGatewayPage />} />
              <Route path="/search" element={user ? <SearchPage user={user} /> : <Navigate to="/powerscale" />} />
              <Route path="/cart" element={user ? <ReviewCartPage user={user} /> : <Navigate to="/powerscale" />} />
              <Route path="/settings/:id" element={<SettingDetailPage user={user} />} />
              <Route path="/contribute" element={user ? <ContributePage user={user} /> : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? <ProfilePage user={user} /> : <Navigate to="/login" />} />
              <Route path="/login" element={user ? <Navigate to="/search" /> : <LoginPage onLogin={login} />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
              <Route path="/verified" element={<VerifiedPage />} />
              <Route path="/admin" element={user?.isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/" />} />
              <Route path="/admin/users" element={user?.isAdmin ? <AdminUsersPage user={user} /> : <Navigate to="/" />} />
              <Route path="/admin/settings" element={user?.isAdmin ? <AdminSettingsPage user={user} /> : <Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
