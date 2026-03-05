import { Link } from 'react-router-dom'
import Badge from './ui/Badge'
import VoteButtons from './VoteButtons'

function SettingCard({ setting, user, onVote, showAttribution = true, onDelete }) {
  // Helper to extract value from SQL null types
  const getValue = (field) => {
    if (field === null || field === undefined) return null
    if (typeof field === 'object' && 'Valid' in field) {
      return field.Valid ? field.String : null
    }
    return field
  }

  // Handle both capitalized and lowercase field names
  const laserType = setting.laser_type || setting.LaserType
  const wattage = setting.wattage || setting.Wattage
  const materialName = setting.material_name || setting.MaterialName
  const operationType = setting.operation_type || setting.OperationType
  const categoryName = setting.category_name || setting.CategoryName
  const maxPower = setting.max_power || setting.MaxPower
  const speed = setting.speed || setting.Speed
  const numPasses = setting.num_passes || setting.NumPasses
  const frequency = getValue(setting.frequency || setting.Frequency)
  const scanInterval = getValue(setting.scan_interval || setting.ScanInterval)
  const notes = getValue(setting.notes || setting.Notes)
  const displayName = getValue(setting.display_name || setting.DisplayName)
  const firstName = setting.first_name || setting.FirstName
  const lastName = setting.last_name || setting.LastName
  const email = setting.email || setting.Email
  const voteScore = parseInt(setting.vote_score || setting.VoteScore || 0)
  const settingId = setting.id || setting.ID
  const settingUserId = setting.user_id || setting.UserID

  // Check if current user owns this setting (ensure both IDs are numbers for comparison)
  const isOwner = user && settingUserId && user.id && Number(settingUserId) === Number(user.id)

  // Determine attribution display (displayName > firstName lastName > email)
  const attribution = displayName || (firstName && lastName ? `${firstName} ${lastName}` : email)

  // Extract ImageMode
  let imageMode = ''
  const imgMode = setting.image_mode || setting.ImageMode
  if (imgMode && typeof imgMode === 'object' && imgMode.String) {
    imageMode = imgMode.String
  } else if (imgMode && typeof imgMode === 'string') {
    imageMode = imgMode
  }

  // Determine proper mode display (Line, Fill, Image - Jarvis, etc.)
  let modeDisplay = 'Line'
  if (imageMode) {
    const imageModeDisplay = imageMode === '3dslice' ? '3D Sliced' :
                            imageMode.charAt(0).toUpperCase() + imageMode.slice(1)
    modeDisplay = `Image - ${imageModeDisplay}`
  } else if (operationType === 'Scan') {
    modeDisplay = 'Fill'
  } else if (operationType === 'Cut') {
    modeDisplay = 'Line'
  }

  return (
    <div className="bg-ls-surface border border-ls-border rounded-xl p-5 hover:border-ls-accent/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Laser + Material */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-semibold text-ls-text">
              {laserType} {wattage}W
            </span>
            <span className="text-ls-text-muted">on</span>
            <span className="font-semibold text-ls-accent">{materialName}</span>
          </div>

          {/* Mode badge */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="accent">{modeDisplay}</Badge>
          </div>

          {/* Settings grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-xs text-ls-text-muted">Speed</p>
              <p className="text-sm font-semibold text-ls-text">{parseFloat(speed).toFixed(0)} mm/s</p>
            </div>
            <div>
              <p className="text-xs text-ls-text-muted">Power</p>
              <p className="text-sm font-semibold text-ls-text">{parseFloat(maxPower).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-ls-text-muted">Frequency</p>
              <p className="text-sm font-semibold text-ls-text">{frequency ? `${(parseFloat(frequency) / 1000).toFixed(0)} kHz` : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-ls-text-muted">Passes</p>
              <p className="text-sm font-semibold text-ls-text">{numPasses}</p>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <p className="text-sm text-ls-text-muted italic line-clamp-2">{notes}</p>
          )}

          {/* Attribution */}
          {showAttribution && (
            <p className="text-xs text-ls-text-muted mt-2">
              by {attribution}
            </p>
          )}
        </div>

        {/* Vote and Details column */}
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-ls-text-muted">
            Votes: <span className="font-semibold text-ls-text">{voteScore}</span>
          </p>
          {showAttribution && (
            <Link
              to={`/settings/${settingId}`}
              className="text-xs text-ls-accent hover:underline mt-2"
            >
              Details
            </Link>
          )}
          {isOwner && onDelete && (
            <button
              onClick={() => {
                console.log('Delete button clicked for setting:', settingId)
                console.log('isOwner:', isOwner, 'user.id:', user?.id, 'settingUserId:', settingUserId)
                if (window.confirm('Are you sure you want to delete this setting? This cannot be undone.')) {
                  onDelete(settingId)
                }
              }}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingCard
