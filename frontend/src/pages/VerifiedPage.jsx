import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

function VerifiedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-ls-dark flex items-center justify-center px-6">
      <Card className="w-full max-w-md text-center py-12">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-1">
          <span className="text-5xl font-bold text-white">Laser</span>
          <span className="text-5xl font-bold text-ls-accent">scribed</span>
        </div>

        {/* Success Icon */}
        <div className="mb-6">
          <svg className="w-20 h-20 text-ls-green mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-ls-text mb-3">
          Thanks for using Laserscribe!
        </h1>
        <p className="text-ls-text-muted mb-8">
          Your email has been verified. You're all set to explore laser settings and contribute to the community.
        </p>

        {/* Button to Login */}
        <Button
          onClick={() => navigate('/login')}
          size="lg"
          className="w-full"
        >
          Sign In Now
        </Button>
      </Card>
    </div>
  )
}

export default VerifiedPage
