import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ContributePage from './pages/ContributePage'
import SettingDetailPage from './pages/SettingDetailPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

const queryClient = new QueryClient()

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ls_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (userData) => {
    localStorage.setItem('ls_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ls_user')
    setUser(null)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-ls-dark">
          <Sidebar user={user} onLogout={logout} />
          <div className="lg:ml-64">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage user={user} />} />
              <Route path="/settings/:id" element={<SettingDetailPage user={user} />} />
              <Route path="/contribute" element={user ? <ContributePage user={user} /> : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? <ProfilePage user={user} /> : <Navigate to="/login" />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage onLogin={login} />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage onLogin={login} />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
