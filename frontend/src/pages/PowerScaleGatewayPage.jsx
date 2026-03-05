import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const StarburstSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 left-1/2 w-[0.55em] h-[0.55em]" style={{ transform: 'translate(-50%, -35%)' }}>
    <circle cx="12" cy="12" r="5" fill="#f97316" />
    <line x1="12" y1="1" x2="12" y2="5" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="23" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="1" y1="12" x2="5" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="19" y1="12" x2="23" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.2" y1="4.2" x2="7.2" y2="7.2" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="16.8" y1="16.8" x2="19.8" y2="19.8" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.2" y1="19.8" x2="7.2" y2="16.8" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="16.8" y1="7.2" x2="19.8" y2="4.2" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

function PowerScaleGatewayPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-4xl w-full">
        {/* PowerScale Logo */}
        <div className="text-center mb-10">
          <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none inline-block mb-3">
            <span className="text-white">P</span>
            <span className="relative inline-block">
              <span className="invisible">o</span>
              <StarburstSvg />
            </span>
            <span className="text-white">wer</span>
            <span className="text-ls-accent">Scale</span>
          </div>
          <div className="text-sm sm:text-base font-semibold text-gray-500 uppercase" style={{ letterSpacing: '0.25em' }}>
            Crowd-Sourced Laser Settings
          </div>
        </div>

        <p className="text-lg text-ls-text-muted text-center max-w-2xl mx-auto mb-12">
          Find the perfect laser settings for your machine and material. Search community-validated power, speed, and pass combinations — or contribute your own tested settings.
        </p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Login Card */}
          <Card className="p-8 hover:border-ls-accent/50 transition-all">
            <div className="mb-6">
              <div className="w-14 h-14 bg-ls-accent/10 border border-ls-accent/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-ls-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-ls-text mb-2">Sign In</h2>
              <p className="text-sm text-ls-text-muted mb-6">
                Already have an account? Sign in to search settings, vote on the best configurations, and contribute your own tested parameters.
              </p>
            </div>
            <Link to="/login">
              <Button className="w-full" size="lg">
                Sign In to PowerScale
              </Button>
            </Link>
          </Card>

          {/* Create Account Card */}
          <Card className="p-8 hover:border-ls-accent/50 transition-all">
            <div className="mb-6">
              <div className="w-14 h-14 bg-ls-blue/10 border border-ls-blue/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-ls-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-ls-text mb-2">Create Account</h2>
              <p className="text-sm text-ls-text-muted mb-6">
                New to PowerScale? Create a free account to access the full database, vote on settings, and share your expertise with the community.
              </p>
            </div>
            <Link to="/register">
              <Button className="w-full" variant="outline" size="lg">
                Create Free Account
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PowerScaleGatewayPage
