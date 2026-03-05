import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ContributeModal from '../components/ContributeModal'

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

function SearchPage({ user }) {
  const navigate = useNavigate()
  const [laserType, setLaserType] = useState('')
  const [wattage, setWattage] = useState('')
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [settings, setSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSettings, setSelectedSettings] = useState([])
  const [userVotes, setUserVotes] = useState({}) // Track user's votes: { settingId: voteValue }
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [viewingSetting, setViewingSetting] = useState(null) // Setting being viewed in modal
  const itemsPerPage = 10

  const hasFilters = laserType || wattage || keyword

  // Fetch settings when filters change
  const fetchSettings = async () => {
    if (!hasFilters) {
      setSettings(null)
      return
    }

    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (laserType) queryParams.set('laser_type', laserType)
      if (wattage) queryParams.set('wattage', wattage)
      if (keyword) queryParams.set('keyword', keyword)

      const response = await fetch(`/api/settings?${queryParams}`, { credentials: 'include' })
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setSettings([])
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate pagination
  const totalPages = settings ? Math.ceil(settings.length / itemsPerPage) : 0
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSettings = settings ? settings.slice(startIndex, endIndex) : []

  const clearFilters = () => {
    setLaserType('')
    setWattage('')
    setKeyword('')
    setCurrentPage(1)
    setSettings(null)
  }

  const handleLaserTypeChange = (e) => {
    setLaserType(e.target.value)
    setCurrentPage(1)
  }

  const handleWattageChange = (e) => {
    setWattage(e.target.value)
    setCurrentPage(1)
  }

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value)
    setCurrentPage(1)
  }

  const handleSearch = () => {
    fetchSettings()
  }

  const handleVote = async (settingId, value) => {
    const currentVote = userVotes[settingId] || 0

    // If clicking the same button, remove vote (toggle)
    if (currentVote === value) {
      value = 0
    }

    try {
      await fetch(`/api/settings/${settingId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value })
      })

      // Calculate the score change
      const scoreDelta = value - currentVote

      // Update the vote score locally
      setSettings(prevSettings =>
        prevSettings.map(s =>
          s.ID === settingId
            ? { ...s, VoteScore: parseInt(s.VoteScore || 0) + scoreDelta }
            : s
        )
      )

      // Track user's vote
      setUserVotes(prev => ({
        ...prev,
        [settingId]: value
      }))
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const toggleSelectSetting = (settingId) => {
    setSelectedSettings(prev =>
      prev.includes(settingId)
        ? prev.filter(id => id !== settingId)
        : [...prev, settingId]
    )
  }

  const handleGoToCart = () => {
    const cartItems = settings?.filter(s => selectedSettings.includes(s.ID)) || []
    navigate('/cart', { state: { cartItems } })
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='translate(40, 40)' opacity='0.2'%3E%3Ccircle cx='0' cy='0' r='5' fill='%23f97316'/%3E%3Cline x1='0' y1='-15' x2='0' y2='-10' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='0' y1='10' x2='0' y2='15' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='-15' y1='0' x2='-10' y2='0' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='10' y1='0' x2='15' y2='0' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='-10.6' y1='-10.6' x2='-7.5' y2='-7.5' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='7.5' y1='7.5' x2='10.6' y2='10.6' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='-10.6' y1='10.6' x2='-7.5' y2='7.5' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='7.5' y1='-7.5' x2='10.6' y2='-10.6' stroke='%23f97316' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '80px 80px'
    }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Cart Icon - Top Right */}
      <div className="flex justify-end mb-4">
        <div onClick={handleGoToCart} className="relative cursor-pointer group">
          <svg className="w-8 h-8 text-ls-accent group-hover:text-ls-accent-dark transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {selectedSettings.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-ls-red text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-ls-dark">
              {selectedSettings.length}
            </div>
          )}
        </div>
      </div>

      {/* PowerScale Logo */}
      <div className="text-center mb-8">
        <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none inline-block mb-3">
          <span className="text-white">P</span>
          <span className="relative inline-block">
            <span className="invisible">o</span>
            <StarburstSvg />
          </span>
          <span className="text-white">wer</span>
          <span className="text-ls-accent">Scale</span>
        </div>
        <p className="text-ls-text-muted text-sm sm:text-base">
          Search community-validated laser settings
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-ls-surface/50 border border-ls-accent/30 rounded-xl p-6 mb-6">
        <p className="text-ls-text text-center max-w-3xl mx-auto mb-4">
          All material settings in <span className="text-ls-accent font-semibold">PowerScale</span> are based on <strong>LightBurn™</strong> conventions.
          This ensures consistency and compatibility with your existing laser workflow, making it easy to import and use these community-tested settings directly in your projects.
        </p>
        <p className="text-ls-text text-center max-w-3xl mx-auto mb-4">
          Found the perfect settings for your material? <span className="text-ls-accent font-semibold">Share them with the community!</span> Your
          contributions help others skip the trial-and-error phase and get straight to creating. Together, we're building the most comprehensive
          laser settings database available.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => setIsContributeModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-10 px-6 text-sm bg-ls-accent text-white hover:bg-ls-accent-dark shadow-lg"
          >
            Contribute Now
          </button>
        </div>
      </div>

      {/* Search Filters Card */}
      <div className="bg-ls-surface border border-ls-accent rounded-xl p-6 mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-ls-text mb-2">Search Material Settings</h2>
          <p className="text-sm text-ls-text-muted">
            Filter by your laser specifications to find community recommended settings
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Laser Type */}
          <div>
            <label htmlFor="laserType" className="block text-sm font-medium text-ls-accent mb-1.5">
              Laser Type
            </label>
            <select
              id="laserType"
              value={laserType}
              onChange={handleLaserTypeChange}
              className="w-full px-4 py-2.5 bg-ls-surface border border-ls-border rounded-lg text-ls-text focus:outline-none focus:ring-2 focus:ring-ls-accent focus:border-transparent transition-all"
            >
              <option value="">Any laser type</option>
              <option value="CO2">CO2</option>
              <option value="Fiber">Fiber</option>
              <option value="Diode">Diode</option>
              <option value="UV">UV</option>
              <option value="Infrared">Infrared</option>
            </select>
          </div>

          {/* Wattage */}
          <div>
            <label htmlFor="wattage" className="block text-sm font-medium text-ls-accent mb-1.5">
              Laser Wattage (W)
            </label>
            <input
              type="number"
              id="wattage"
              min="1"
              placeholder="Any wattage"
              value={wattage}
              onChange={handleWattageChange}
              className="w-full px-4 py-2.5 bg-ls-surface border border-ls-border rounded-lg text-ls-text placeholder:text-ls-text-muted/50 focus:outline-none focus:ring-2 focus:ring-ls-accent focus:border-transparent transition-all"
            />
          </div>

          {/* Keyword */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-ls-accent mb-1.5">
              Material Keyword
            </label>
            <input
              type="text"
              id="keyword"
              placeholder="Search materials..."
              value={keyword}
              onChange={handleKeywordChange}
              className="w-full px-4 py-2.5 bg-ls-surface border border-ls-border rounded-lg text-ls-text placeholder:text-ls-text-muted/50 focus:outline-none focus:ring-2 focus:ring-ls-accent focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-9 px-4 text-xs text-ls-text-muted hover:bg-ls-surface-hover hover:text-ls-text"
            >
              Clear Filters
            </button>
          )}
          <button
            type="button"
            onClick={handleSearch}
            disabled={!hasFilters}
            className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-9 px-4 text-xs bg-ls-accent text-white hover:bg-ls-accent-dark shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results Section */}
      {!hasFilters && !settings && (
        <div className="text-center py-16">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-ls-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-lg text-ls-text-muted">
            Apply filters above to search for settings
          </p>
        </div>
      )}

      {hasFilters && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ls-text text-center mb-4">
              Search Results
            </h2>
            {/* Column Headers - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-6 px-4 pb-2 text-sm font-semibold text-ls-accent border-b border-ls-accent/30">
              <div className="w-5"></div> {/* Checkbox spacing */}
              <div className="flex-1 grid grid-cols-6 gap-4">
                <span>Laser</span>
                <span>Material</span>
                <span className="text-center">Mode</span>
                <span>Speed</span>
                <span>Power</span>
                <span>Frequency</span>
              </div>
              <div className="w-24 text-center">Votes</div>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-ls-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-ls-text-muted">Loading settings...</p>
            </div>
          )}

          {!isLoading && settings && settings.length > 0 && (
            <>
              <div className="space-y-3 mb-6">
                {paginatedSettings.map((setting) => {
                  // Truncate material name to 20 characters
                  let materialName = setting.MaterialName || setting.material_name || 'Unknown'
                  if (materialName.length > 20) {
                    materialName = materialName.substring(0, 20) + '...'
                  }

                  const voteScore = parseInt(setting.VoteScore || setting.vote_score || 0)
                  const userVote = userVotes[setting.ID] || 0

                  // Extract ImageMode (handle both object and string formats)
                  let imageMode = ''
                  if (setting.ImageMode && typeof setting.ImageMode === 'object' && setting.ImageMode.String) {
                    imageMode = setting.ImageMode.String
                  } else if (setting.ImageMode && typeof setting.ImageMode === 'string') {
                    imageMode = setting.ImageMode
                  }

                  // Determine mode display (what users see in LightBurn)
                  let modeDisplay = 'Line' // Default for Cut operation
                  if (imageMode) {
                    // Image mode - show dither type
                    const imageModeDisplay = imageMode === '3dslice' ? '3D Sliced' :
                                            imageMode.charAt(0).toUpperCase() + imageMode.slice(1)
                    modeDisplay = `Image - ${imageModeDisplay}`
                  } else if (setting.OperationType === 'Scan') {
                    modeDisplay = 'Fill'
                  } else if (setting.OperationType === 'Cut') {
                    modeDisplay = 'Line'
                  }

                  // Extract Frequency (handle both object and string formats)
                  let frequency = ''
                  if (setting.Frequency && typeof setting.Frequency === 'object' && setting.Frequency.String) {
                    frequency = setting.Frequency.String
                  } else if (setting.Frequency && typeof setting.Frequency === 'string') {
                    frequency = setting.Frequency
                  } else if (setting.frequency) {
                    frequency = setting.frequency
                  }

                  return (
                    <div key={setting.ID} className="bg-ls-surface border border-ls-accent rounded-lg p-4 hover:bg-ls-surface-hover transition-colors cursor-pointer" onClick={() => setViewingSetting(setting)}>
                      {/* Mobile Layout */}
                      <div className="lg:hidden space-y-3">
                        {/* Header row with checkbox and laser info */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedSettings.includes(setting.ID)}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleSelectSetting(setting.ID)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 mt-0.5 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="text-ls-text font-bold text-lg mb-1">
                              {setting.LaserType} {setting.Wattage}W
                            </div>
                            <div className="text-ls-accent font-medium text-base mb-2">
                              {materialName}
                            </div>
                            <div className="inline-block px-3 py-1 bg-ls-accent/20 text-ls-accent text-sm font-semibold rounded">
                              {modeDisplay}
                            </div>
                          </div>
                        </div>

                        {/* Settings grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-ls-text-muted">Speed:</span>
                            <span className="text-ls-text font-semibold ml-2">{parseFloat(setting.Speed).toFixed(0)} mm/s</span>
                          </div>
                          <div>
                            <span className="text-ls-text-muted">Power:</span>
                            <span className="text-ls-text font-semibold ml-2">{parseFloat(setting.MaxPower).toFixed(0)}%</span>
                          </div>
                          {frequency && (
                            <div className="col-span-2">
                              <span className="text-ls-text-muted">Frequency:</span>
                              <span className="text-ls-text font-semibold ml-2">{(parseFloat(frequency) / 1000).toFixed(0)} kHz</span>
                            </div>
                          )}
                        </div>

                        {/* Vote buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ls-border" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(setting.ID, 1)
                            }}
                            className={`p-2 rounded transition-colors cursor-pointer ${
                              userVote === 1
                                ? 'bg-ls-green/20 hover:bg-ls-green/30'
                                : 'hover:bg-ls-surface-hover'
                            }`}
                            title={userVote === 1 ? "Remove upvote" : "Upvote"}
                          >
                            <svg className={`w-6 h-6 ${userVote === 1 ? 'text-ls-green' : 'text-ls-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                          </button>
                          <span className="text-ls-text font-bold text-lg min-w-[2.5rem] text-center">
                            {voteScore}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(setting.ID, -1)
                            }}
                            className={`p-2 rounded transition-colors cursor-pointer ${
                              userVote === -1
                                ? 'bg-ls-red/20 hover:bg-ls-red/30'
                                : 'hover:bg-ls-surface-hover'
                            }`}
                            title={userVote === -1 ? "Remove downvote" : "Downvote"}
                          >
                            <svg className={`w-6 h-6 ${userVote === -1 ? 'text-ls-red' : 'text-ls-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:flex items-center gap-6">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedSettings.includes(setting.ID)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelectSetting(setting.ID)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 rounded border-ls-border bg-ls-surface text-ls-accent focus:ring-2 focus:ring-ls-accent cursor-pointer"
                        />

                        {/* Grid layout for all fields */}
                        <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                          {/* Laser */}
                          <div className="text-ls-text font-semibold whitespace-nowrap">
                            {setting.LaserType} {setting.Wattage}W
                          </div>

                          {/* Material */}
                          <div className="text-ls-accent font-medium truncate">
                            {materialName}
                          </div>

                          {/* Mode */}
                          <div className="text-ls-text-muted font-bold text-sm whitespace-nowrap text-center">
                            {modeDisplay}
                          </div>

                          {/* Speed */}
                          <div className="text-ls-text font-semibold text-sm whitespace-nowrap">
                            {parseFloat(setting.Speed).toFixed(0)} mm/s
                          </div>

                          {/* Power */}
                          <div className="text-ls-text font-semibold text-sm whitespace-nowrap">
                            {parseFloat(setting.MaxPower).toFixed(0)}%
                          </div>

                          {/* Frequency */}
                          <div className="text-ls-text font-semibold text-sm whitespace-nowrap">
                            {frequency ? `${(parseFloat(frequency) / 1000).toFixed(0)} kHz` : '-'}
                          </div>
                        </div>

                        {/* Vote buttons */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(setting.ID, 1)
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              userVote === 1
                                ? 'bg-ls-green/20 hover:bg-ls-green/30'
                                : 'hover:bg-ls-surface-hover'
                            }`}
                            title={userVote === 1 ? "Remove upvote" : "Upvote"}
                          >
                            <svg className={`w-5 h-5 ${userVote === 1 ? 'text-ls-green' : 'text-ls-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                          </button>
                          <span className="text-ls-text font-semibold min-w-[2rem] text-center">
                            {voteScore}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(setting.ID, -1)
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              userVote === -1
                                ? 'bg-ls-red/20 hover:bg-ls-red/30'
                                : 'hover:bg-ls-surface-hover'
                            }`}
                            title={userVote === -1 ? "Remove downvote" : "Downvote"}
                          >
                            <svg className={`w-5 h-5 ${userVote === -1 ? 'text-ls-red' : 'text-ls-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-9 px-4 text-xs border-2 border-ls-accent text-ls-accent bg-transparent hover:bg-ls-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-ls-text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-9 px-4 text-xs border-2 border-ls-accent text-ls-accent bg-transparent hover:bg-ls-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Add to Cart Button */}
              {selectedSettings.length > 0 && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      // TODO: Implement cart functionality
                      alert(`Adding ${selectedSettings.length} settings to cart`)
                    }}
                    className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-10 px-6 text-sm bg-ls-accent text-white hover:bg-ls-accent-dark shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add Selected to Cart ({selectedSettings.length})
                  </button>
                </div>
              )}
            </>
          )}

          {!isLoading && settings && settings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-ls-text-muted">No settings found</p>
            </div>
          )}
        </>
      )}
      </div>

      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        user={user}
      />

      {/* View Setting Modal */}
      {viewingSetting && (
        <ViewSettingModal setting={viewingSetting} onClose={() => setViewingSetting(null)} />
      )}
    </div>
  )
}

// View Setting Modal Component
function ViewSettingModal({ setting, onClose }) {
  // Extract ImageMode for modal
  let imageMode = ''
  if (setting.ImageMode && typeof setting.ImageMode === 'object' && setting.ImageMode.String) {
    imageMode = setting.ImageMode.String
  } else if (setting.ImageMode && typeof setting.ImageMode === 'string') {
    imageMode = setting.ImageMode
  }

  // Determine mode display
  let modeDisplay = 'Line'
  if (imageMode) {
    const imageModeDisplay = imageMode === '3dslice' ? '3D Sliced' :
                            imageMode.charAt(0).toUpperCase() + imageMode.slice(1)
    modeDisplay = `Image - ${imageModeDisplay}`
  } else if (setting.OperationType === 'Scan') {
    modeDisplay = 'Fill'
  } else if (setting.OperationType === 'Cut') {
    modeDisplay = 'Line'
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-6 pointer-events-none">
        <div className="bg-ls-darker border border-ls-accent rounded-xl p-6 w-full max-w-2xl pointer-events-auto overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-ls-text">Setting Details</h2>
            <button
              onClick={onClose}
              className="text-ls-text-muted hover:text-ls-text transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Setting Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ls-accent mb-1">Material</label>
                <div className="text-ls-text">{setting.MaterialName || setting.material_name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ls-accent mb-1">Mode</label>
                <div className="text-ls-text font-bold">{modeDisplay}</div>
              </div>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ls-accent mb-1">Speed (mm/s)</label>
                <div className="text-ls-text font-semibold">{parseFloat(setting.Speed).toFixed(2)}</div>
              </div>
              {/* Frequency */}
              {(() => {
                let freq = ''
                if (setting.Frequency && typeof setting.Frequency === 'object' && setting.Frequency.String) {
                  freq = setting.Frequency.String
                } else if (setting.Frequency && typeof setting.Frequency === 'string') {
                  freq = setting.Frequency
                } else if (setting.frequency) {
                  freq = setting.frequency
                }
                return freq ? (
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Frequency (kHz)</label>
                    <div className="text-ls-text font-semibold">{(parseFloat(freq) / 1000).toFixed(2)}</div>
                  </div>
                ) : <div></div>
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ls-accent mb-1">Power (%)</label>
                <div className="text-ls-text font-semibold">{parseFloat(setting.MaxPower).toFixed(2)}</div>
              </div>
            </div>

            {/* Number of Passes */}
            <div>
              <label className="block text-sm font-medium text-ls-accent mb-1">Number of Passes</label>
              <div className="text-ls-text">{setting.NumPasses || 1}</div>
            </div>

            {/* Fill Mode Specific Fields */}
            {setting.OperationType === 'Scan' && !imageMode && (
              <>
                <div className="border-t border-ls-border pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-ls-accent mb-3">Fill Settings</h3>
                </div>

                {setting.ScanInterval && setting.ScanInterval.String && (
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Scan Interval (mm)</label>
                    <div className="text-ls-text">{setting.ScanInterval.String}</div>
                  </div>
                )}

                {setting.Angle && setting.Angle.String && (
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Scan Angle (degrees)</label>
                    <div className="text-ls-text">{setting.Angle.String}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Bi-Directional Fill</label>
                    <div className="text-ls-text">{setting.Bidir ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Cross-Hatch</label>
                    <div className="text-ls-text">{setting.CrossHatch ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </>
            )}

            {/* Image Mode Specific Fields */}
            {imageMode && (
              <>
                <div className="border-t border-ls-border pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-ls-accent mb-3">Image Settings</h3>
                </div>

                {setting.ScanInterval && setting.ScanInterval.String && (
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Scan Interval (mm)</label>
                    <div className="text-ls-text">{setting.ScanInterval.String}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {setting.Angle && setting.Angle.String && (
                    <div>
                      <label className="block text-sm font-medium text-ls-accent mb-1">Scan Angle (degrees)</label>
                      <div className="text-ls-text">{setting.Angle.String}</div>
                    </div>
                  )}

                  {setting.AnglePerPass && setting.AnglePerPass.String && (
                    <div>
                      <label className="block text-sm font-medium text-ls-accent mb-1">Angle Per Pass (degrees)</label>
                      <div className="text-ls-text">{setting.AnglePerPass.String}</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Bi-Directional</label>
                    <div className="text-ls-text">{setting.Bidir ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Cross-Hatch</label>
                    <div className="text-ls-text">{setting.CrossHatch ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Negative Image</label>
                    <div className="text-ls-text">{setting.NegativeImage ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Use Dot Correction</label>
                    <div className="text-ls-text">
                      {setting.UseDotCorrection && setting.UseDotCorrection.Bool ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {setting.DotWidth && setting.DotWidth.String && (
                  <div>
                    <label className="block text-sm font-medium text-ls-accent mb-1">Dot Width (ms)</label>
                    <div className="text-ls-text">{setting.DotWidth.String}</div>
                  </div>
                )}
              </>
            )}

            {/* Notes */}
            {setting.Notes && setting.Notes.String && (
              <div className="border-t border-ls-border pt-4 mt-4">
                <label className="block text-sm font-medium text-ls-accent mb-1">Notes</label>
                <div className="text-ls-text-muted text-sm">{setting.Notes.String}</div>
              </div>
            )}

            {/* Close button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-10 px-6 text-sm bg-ls-accent text-white hover:bg-ls-accent-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SearchPage
