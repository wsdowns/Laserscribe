import { useQuery, useQueryClient } from '@tanstack/react-query'
import SettingsTable from '../components/SettingsTable'

function ProfilePage({ user }) {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['profile', 'settings'],
    queryFn: () =>
      fetch('/api/profile/settings', { credentials: 'include' }).then(r => r.json()),
  })

  const handleDelete = async (settingId) => {
    console.log('Deleting setting:', settingId)
    try {
      const response = await fetch(`/api/settings/${settingId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      console.log('Delete response status:', response.status)

      if (response.ok) {
        console.log('Delete successful, refreshing...')
        // Refresh the settings list
        await queryClient.refetchQueries(['profile', 'settings'])
        console.log('Settings refreshed')
      } else {
        const data = await response.json()
        console.error('Delete failed:', data)
        alert(data.error || 'Failed to delete setting')
      }
    } catch (error) {
      console.error('Error deleting setting:', error)
      alert('Failed to delete setting')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ls-text mb-2">Your Contributions</h1>
        <p className="text-ls-text-muted">
          Settings you've shared with the Laserscribe community
        </p>
      </div>

      <div className="bg-ls-surface border border-ls-border rounded-xl p-6 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-ls-accent/15 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-ls-accent">
            {(user.displayName || user.email).charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-ls-text">{user.displayName || `${user.firstName} ${user.lastName}`}</p>
          <p className="text-sm text-ls-text-muted">{user.email}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-ls-accent">{settings?.length || 0}</p>
          <p className="text-xs text-ls-text-muted">settings shared</p>
        </div>
      </div>

      <SettingsTable settings={settings} isLoading={isLoading} user={user} showAttribution={false} onDelete={handleDelete} />
    </div>
  )
}

export default ProfilePage
