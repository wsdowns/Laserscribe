import Card from '../components/ui/Card'
import ContributeForm from '../components/ContributeForm'

function ContributePage({ user }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ls-text mb-2">Contribute a Setting</h1>
        <p className="text-ls-text-muted">
          Share your tested laser settings with the community. Every contribution helps someone skip the trial-and-error.
        </p>
      </div>

      <Card>
        <ContributeForm user={user} />
      </Card>
    </div>
  )
}

export default ContributePage
