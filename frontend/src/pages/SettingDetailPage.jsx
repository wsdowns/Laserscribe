import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import VoteButtons from '../components/VoteButtons'

function SettingDetailPage({ user }) {
  const { id } = useParams()

  const { data: setting, isLoading } = useQuery({
    queryKey: ['setting', id],
    queryFn: () => fetch(`/api/settings/${id}`).then(r => r.json()),
  })

  function handleVote(value) {
    if (!user) {
      alert('Sign in to vote')
      return
    }
    fetch(`/api/settings/${id}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ value }),
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ls-surface rounded w-1/2" />
          <div className="h-40 bg-ls-surface rounded" />
        </div>
      </div>
    )
  }

  if (!setting || setting.error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center">
        <p className="text-ls-text-muted text-lg">Setting not found</p>
        <Link to="/search" className="text-ls-accent hover:underline mt-4 inline-block">
          Back to search
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link to="/search" className="text-sm text-ls-text-muted hover:text-ls-accent mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to search
      </Link>

      <Card className="mt-4">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ls-text mb-2">
              {setting.BrandName} {setting.ModelName}
            </h1>
            <p className="text-lg text-ls-accent font-medium">{setting.MaterialName}</p>
          </div>
          <VoteButtons
            score={setting.VoteScore}
            userVote={0}
            onVote={(_, val) => handleVote(val)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="accent">{setting.OperationName}</Badge>
          <Badge variant="blue">{setting.CategoryName}</Badge>
          <Badge variant="default">{setting.VoteCount} votes</Badge>
        </div>

        {/* Settings grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-5 bg-ls-dark/50 rounded-lg mb-6">
          <div>
            <p className="text-xs text-ls-text-muted uppercase tracking-wider mb-1">Power</p>
            <p className="text-2xl font-bold text-ls-text">{setting.Power}<span className="text-sm text-ls-text-muted">%</span></p>
          </div>
          <div>
            <p className="text-xs text-ls-text-muted uppercase tracking-wider mb-1">Speed</p>
            <p className="text-2xl font-bold text-ls-text">{setting.Speed}</p>
          </div>
          <div>
            <p className="text-xs text-ls-text-muted uppercase tracking-wider mb-1">Passes</p>
            <p className="text-2xl font-bold text-ls-text">{setting.Passes}</p>
          </div>
          {setting.Dpi?.Valid && (
            <div>
              <p className="text-xs text-ls-text-muted uppercase tracking-wider mb-1">DPI</p>
              <p className="text-2xl font-bold text-ls-text">{setting.Dpi.Int32}</p>
            </div>
          )}
          {setting.Frequency?.Valid && (
            <div>
              <p className="text-xs text-ls-text-muted uppercase tracking-wider mb-1">Frequency</p>
              <p className="text-2xl font-bold text-ls-text">{setting.Frequency.Int32}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {setting.Notes?.Valid && setting.Notes.String && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-ls-text-muted uppercase tracking-wider mb-2">Notes</h3>
            <p className="text-ls-text">{setting.Notes.String}</p>
          </div>
        )}

        {/* Attribution */}
        <div className="border-t border-ls-border pt-4 flex items-center justify-between text-sm text-ls-text-muted">
          <span>
            Contributed by <span className="text-ls-text font-medium">{setting.DisplayName?.Valid ? setting.DisplayName.String : setting.Username}</span>
          </span>
          <span>{new Date(setting.CreatedAt).toLocaleDateString()}</span>
        </div>
      </Card>
    </div>
  )
}

export default SettingDetailPage
