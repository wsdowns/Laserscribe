import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    displayName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }
      setRegistered(true)
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <Card className="w-full max-w-md text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-ls-green mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ls-text mb-2">Check Your Email</h1>
          <p className="text-ls-text-muted mb-6">
            We've sent a verification link to <span className="text-ls-text font-medium">{form.email}</span>. Click the link to activate your account.
          </p>
          <p className="text-sm text-ls-text-muted">
            Already verified?{' '}
            <Link to="/login" className="text-ls-accent hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ls-text mb-2">Join Laserscribe</h1>
          <p className="text-ls-text-muted text-sm">Create an account to contribute settings and vote</p>
        </div>

        {error && (
          <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-3 mb-6 text-ls-red text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              autoComplete="given-name"
            />
            <Input
              label="Last Name"
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              autoComplete="family-name"
            />
          </div>
          <Input
            label="Email"
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
          <Input
            label="Display Name"
            id="displayName"
            placeholder="Optional"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <Input
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="new-password"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-ls-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-ls-accent hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default RegisterPage
