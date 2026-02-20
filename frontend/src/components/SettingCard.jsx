import { Link } from 'react-router-dom'
import Badge from './ui/Badge'
import VoteButtons from './VoteButtons'

function SettingCard({ setting, user, onVote }) {
  return (
    <div className="bg-ls-surface border border-ls-border rounded-xl p-5 hover:border-ls-accent/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Machine + Material */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-semibold text-ls-text">
              {setting.BrandName} {setting.ModelName}
            </span>
            <span className="text-ls-text-muted">on</span>
            <span className="font-semibold text-ls-accent">{setting.MaterialName}</span>
          </div>

          {/* Operation badge */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="accent">{setting.OperationName}</Badge>
            <Badge variant="blue">{setting.CategoryName}</Badge>
          </div>

          {/* Settings grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-xs text-ls-text-muted">Power</p>
              <p className="text-sm font-semibold text-ls-text">{setting.Power}%</p>
            </div>
            <div>
              <p className="text-xs text-ls-text-muted">Speed</p>
              <p className="text-sm font-semibold text-ls-text">{setting.Speed}</p>
            </div>
            <div>
              <p className="text-xs text-ls-text-muted">Passes</p>
              <p className="text-sm font-semibold text-ls-text">{setting.Passes}</p>
            </div>
            {setting.Dpi?.Valid && (
              <div>
                <p className="text-xs text-ls-text-muted">DPI</p>
                <p className="text-sm font-semibold text-ls-text">{setting.Dpi.Int32}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {setting.Notes?.Valid && setting.Notes.String && (
            <p className="text-sm text-ls-text-muted italic">{setting.Notes.String}</p>
          )}

          {/* Attribution */}
          <p className="text-xs text-ls-text-muted mt-2">
            by {setting.DisplayName?.Valid ? setting.DisplayName.String : setting.Username}
          </p>
        </div>

        {/* Vote column */}
        <div className="flex flex-col items-center gap-1">
          <VoteButtons
            score={setting.VoteScore}
            userVote={0}
            onVote={(val) => onVote?.(setting.ID, val)}
            size="sm"
          />
          <Link
            to={`/settings/${setting.ID}`}
            className="text-xs text-ls-accent hover:underline mt-2"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SettingCard
