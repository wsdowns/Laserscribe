import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

function AdminSettingsPage() {
  const [materialFilter, setMaterialFilter] = useState('')
  const [laserTypeFilter, setLaserTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminSettings', materialFilter, laserTypeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })
      if (materialFilter) params.append('material_id', materialFilter)
      if (laserTypeFilter) params.append('laser_type', laserTypeFilter)

      const res = await fetch(`/api/admin/settings?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    }
  })

  // Fetch materials for filter dropdown
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await fetch('/api/materials', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch materials')
      return res.json()
    }
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const laserTypes = ['CO2', 'Fiber', 'Diode', 'UV', 'Infrared']

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-ls-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ls-text-muted">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-6 text-center">
          <p className="text-ls-red font-medium">Failed to load settings</p>
          <p className="text-sm text-ls-text-muted mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="text-ls-accent hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-ls-text">Settings Management</h1>
            <p className="text-ls-text-muted mt-1">Total: {data.total} settings</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ls-text-muted mb-2">Material</label>
            <select
              value={materialFilter}
              onChange={(e) => { setMaterialFilter(e.target.value); setPage(0); }}
              className="w-full px-4 py-2 bg-ls-darker border border-ls-border rounded-lg text-ls-text focus:outline-none focus:ring-2 focus:ring-ls-accent"
            >
              <option value="">All Materials</option>
              {materials && materials.map((mat) => (
                <option key={mat.id} value={mat.id}>{mat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ls-text-muted mb-2">Laser Type</label>
            <select
              value={laserTypeFilter}
              onChange={(e) => { setLaserTypeFilter(e.target.value); setPage(0); }}
              className="w-full px-4 py-2 bg-ls-darker border border-ls-border rounded-lg text-ls-text focus:outline-none focus:ring-2 focus:ring-ls-accent"
            >
              <option value="">All Laser Types</option>
              {laserTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {(materialFilter || laserTypeFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => { setMaterialFilter(''); setLaserTypeFilter(''); setPage(0); }}
                className="w-full px-4 py-2 bg-ls-darker border border-ls-border rounded-lg text-ls-text-muted hover:text-ls-text transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Settings Table */}
        <div className="bg-ls-surface border border-ls-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ls-darker">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Laser</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Operation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Power/Speed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Votes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ls-border">
                {data.settings && data.settings.length > 0 ? (
                  data.settings.map((setting) => (
                    <tr key={setting.id} className="hover:bg-ls-darker/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-ls-text">{setting.materialName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-ls-text">{setting.laserType} {setting.wattage}W</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ls-accent/20 text-ls-accent">
                          {setting.operationType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-ls-text">{setting.maxPower}% / {setting.speed}mm/s</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-ls-text">{setting.userDisplayName || setting.userEmail}</p>
                        <p className="text-xs text-ls-text-muted">{setting.userEmail}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-ls-text">{setting.voteScore}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ls-text-muted">
                        {setting.createdAt ? new Date(setting.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/settings/${setting.id}`}
                          className="text-ls-accent hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-ls-text-muted">
                      No settings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-ls-text-muted">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} settings
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-ls-darker border border-ls-border rounded-lg text-ls-text disabled:opacity-50 disabled:cursor-not-allowed hover:border-ls-accent/50 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-ls-text">
                  Page {page + 1} of {totalPages}
                </span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 bg-ls-darker border border-ls-border rounded-lg text-ls-text disabled:opacity-50 disabled:cursor-not-allowed hover:border-ls-accent/50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSettingsPage
