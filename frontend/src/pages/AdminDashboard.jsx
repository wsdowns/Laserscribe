import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    }
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-ls-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ls-text-muted">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-6 text-center">
          <p className="text-ls-red font-medium">Failed to load admin stats</p>
          <p className="text-sm text-ls-text-muted mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-ls-text mb-8">Admin Dashboard</h1>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/admin/users" className="bg-ls-surface border border-ls-border rounded-lg p-6 hover:border-ls-accent/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ls-text">Total Users</h2>
              <svg className="w-8 h-8 text-ls-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-ls-text mb-2">{stats.totalUsers}</p>
            <div className="text-sm text-ls-text-muted space-y-1">
              <p>Verified: {stats.verifiedUsers}</p>
              <p className="text-ls-accent">+{stats.usersThisWeek} this week</p>
            </div>
          </Link>

          <Link to="/admin/settings" className="bg-ls-surface border border-ls-border rounded-lg p-6 hover:border-ls-accent/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ls-text">Total Settings</h2>
              <svg className="w-8 h-8 text-ls-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-ls-text mb-2">{stats.totalSettings}</p>
            <div className="text-sm text-ls-text-muted">
              <p className="text-ls-accent">+{stats.settingsThisWeek} this week</p>
            </div>
          </Link>

          <div className="bg-ls-surface border border-ls-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ls-text">Total Votes</h2>
              <svg className="w-8 h-8 text-ls-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-ls-text mb-2">{stats.totalVotes}</p>
            <div className="text-sm text-ls-text-muted">
              <p className="text-ls-accent">+{stats.votesThisWeek} this week</p>
            </div>
          </div>
        </div>

        {/* Top Materials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-ls-surface border border-ls-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-ls-text mb-4">Top Materials</h2>
            <div className="space-y-3">
              {stats.topMaterials && stats.topMaterials.length > 0 ? (
                stats.topMaterials.map((material, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-ls-border last:border-0">
                    <span className="text-ls-text">{material.MaterialName || material.material_name}</span>
                    <span className="text-ls-accent font-semibold">{material.SettingCount || material.setting_count} settings</span>
                  </div>
                ))
              ) : (
                <p className="text-ls-text-muted text-center py-4">No materials yet</p>
              )}
            </div>
          </div>

          {/* Laser Type Breakdown */}
          <div className="bg-ls-surface border border-ls-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-ls-text mb-4">Settings by Laser Type</h2>
            <div className="space-y-3">
              {stats.laserTypeBreakdown && stats.laserTypeBreakdown.length > 0 ? (
                stats.laserTypeBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-ls-border last:border-0">
                    <span className="text-ls-text">{item.LaserType || item.laser_type}</span>
                    <span className="text-ls-accent font-semibold">{item.Count || item.count} settings</span>
                  </div>
                ))
              ) : (
                <p className="text-ls-text-muted text-center py-4">No laser types yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-ls-surface border border-ls-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-ls-text mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 px-4 py-3 bg-ls-darker border border-ls-border rounded-lg hover:border-ls-accent/50 transition-colors"
            >
              <svg className="w-5 h-5 text-ls-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-ls-text font-medium">Manage Users</span>
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center gap-3 px-4 py-3 bg-ls-darker border border-ls-border rounded-lg hover:border-ls-accent/50 transition-colors"
            >
              <svg className="w-5 h-5 text-ls-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-ls-text font-medium">View All Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
