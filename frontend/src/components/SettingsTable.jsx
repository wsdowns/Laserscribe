import SettingCard from './SettingCard'

function SettingsTable({ settings, user, onVote, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-ls-surface border border-ls-border rounded-xl p-5 animate-pulse">
            <div className="h-5 bg-ls-surface-hover rounded w-3/4 mb-3" />
            <div className="flex gap-2 mb-3">
              <div className="h-5 bg-ls-surface-hover rounded w-16" />
              <div className="h-5 bg-ls-surface-hover rounded w-16" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-10 bg-ls-surface-hover rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!settings || settings.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-ls-text-muted/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-ls-text-muted text-lg">No settings found</p>
        <p className="text-ls-text-muted/60 text-sm mt-1">Try adjusting your filters or be the first to contribute!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <SettingCard
          key={setting.ID}
          setting={setting}
          user={user}
          onVote={onVote}
        />
      ))}
    </div>
  )
}

export default SettingsTable
