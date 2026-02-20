import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SearchFilters from '../components/SearchFilters'
import SettingsTable from '../components/SettingsTable'

function SearchPage({ user }) {
  const [filters, setFilters] = useState({
    brandId: '',
    machineModelId: '',
    materialId: '',
    operationId: '',
  })

  const queryParams = new URLSearchParams()
  if (filters.machineModelId) queryParams.set('machine_model_id', filters.machineModelId)
  if (filters.materialId) queryParams.set('material_id', filters.materialId)
  if (filters.operationId) queryParams.set('operation_id', filters.operationId)

  const hasFilters = filters.machineModelId || filters.materialId || filters.operationId

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', filters.machineModelId, filters.materialId, filters.operationId],
    queryFn: () => fetch(`/api/settings?${queryParams}`).then(r => r.json()),
    enabled: hasFilters,
  })

  const { data: topSettings, isLoading: topLoading } = useQuery({
    queryKey: ['settings', 'top'],
    queryFn: () => fetch('/api/settings/top').then(r => r.json()),
    enabled: !hasFilters,
  })

  function handleVote(settingId, value) {
    if (!user) {
      alert('Sign in to vote')
      return
    }
    fetch(`/api/settings/${settingId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ value }),
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ls-text mb-2">PowerScale</h1>
        <p className="text-ls-text-muted">
          Search crowd-sourced laser settings by machine and material
        </p>
      </div>

      <div className="mb-8">
        <SearchFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {!hasFilters && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-ls-text-muted flex items-center gap-2">
            <svg className="w-5 h-5 text-ls-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Top Rated Settings
          </h2>
        </div>
      )}

      <SettingsTable
        settings={hasFilters ? settings : topSettings}
        isLoading={hasFilters ? isLoading : topLoading}
        user={user}
        onVote={handleVote}
      />
    </div>
  )
}

export default SearchPage
