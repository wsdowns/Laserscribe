import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

function AdminUsersPage({ user: currentUser }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const limit = 50

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })
      if (search) params.append('search', search)

      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    }
  })

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }) => {
      const res = await fetch(`/api/admin/users/${userId}/set-admin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin })
      })
      if (!res.ok) throw new Error('Failed to update admin status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers'])
    }
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-ls-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ls-text-muted">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-ls-red/10 border border-ls-red/30 rounded-lg p-6 text-center">
          <p className="text-ls-red font-medium">Failed to load users</p>
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
            <h1 className="text-3xl font-bold text-ls-text">User Management</h1>
            <p className="text-ls-text-muted mt-1">Total: {data.total} users</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 bg-ls-darker border border-ls-border rounded-lg text-ls-text focus:outline-none focus:ring-2 focus:ring-ls-accent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-ls-accent text-white rounded-lg hover:bg-ls-accent/90 transition-colors font-medium"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(0); }}
                className="px-4 py-2 bg-ls-darker border border-ls-border rounded-lg text-ls-text-muted hover:text-ls-text transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-ls-surface border border-ls-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ls-darker">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Settings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ls-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ls-border">
                {data.users && data.users.length > 0 ? (
                  data.users.map((user) => (
                    <tr key={user.id} className="hover:bg-ls-darker/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-medium text-ls-text">
                              {user.displayName || `${user.firstName} ${user.lastName}`}
                            </p>
                            {user.isAdmin && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ls-accent/20 text-ls-accent">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-ls-text">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.emailVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-ls-text">{user.settingCount}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ls-text-muted">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleAdminMutation.mutate({ userId: user.id, isAdmin: !user.isAdmin })}
                          disabled={user.id === currentUser?.id || toggleAdminMutation.isPending}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            user.id === currentUser?.id
                              ? 'bg-ls-darker text-ls-text-muted cursor-not-allowed'
                              : user.isAdmin
                              ? 'bg-ls-red/20 text-ls-red hover:bg-ls-red/30'
                              : 'bg-ls-accent/20 text-ls-accent hover:bg-ls-accent/30'
                          }`}
                          title={user.id === currentUser?.id ? "You cannot change your own admin status" : ""}
                        >
                          {toggleAdminMutation.isPending ? 'Updating...' : user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-ls-text-muted">
                      No users found
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
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} users
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

export default AdminUsersPage
