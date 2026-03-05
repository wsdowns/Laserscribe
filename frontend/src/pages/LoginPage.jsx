import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

function LoginPage({ onLogin }) {
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverified, setUnverified] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setUnverified(false)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403 && data.error === 'email not verified') {
          setUnverified(true)
        } else {
          setError(data.error || 'Login failed')
        }
        return
      }
      onLogin(data)
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendSent(false)
    // We don't have the email from username alone, so prompt user
    const email = prompt('Enter your email address to resend the verification link:')
    if (!email) return

    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
    setResendSent(true)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ls-text mb-2">Welcome Back</h1>
          <p className="text-ls-text-muted text-sm">Sign in to contribute and vote on settings</p>
        </div>

        {verified === 'true' && (
          <div className="bg-ls-green/10 border border-ls-green/30 rounded-lg p-3 mb-6 text-ls-green text-sm">
            Email verified! You can now sign in.
          </div>
        )}

        {verified === 'expired' && (
          <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-3 mb-6 text-ls-red text-sm">
            Verification link has expired. Please request a new one.
          </div>
        )}

        {verified === 'invalid' && (
          <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-3 mb-6 text-ls-red text-sm">
            Invalid verification link. Please request a new one.
          </div>
        )}

        {error && (
          <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-3 mb-6 text-ls-red text-sm">
            {error}
          </div>
        )}

        {unverified && (
          <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-3 mb-6 text-sm">
            <p className="text-ls-red mb-2">Your email has not been verified yet.</p>
            {resendSent ? (
              <p className="text-ls-text-muted">Verification link sent! Check your email.</p>
            ) : (
              <button onClick={handleResend} className="text-ls-accent hover:underline">
                Resend verification email
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-ls-text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-ls-accent hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default LoginPage
