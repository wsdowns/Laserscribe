import ContributeForm from './ContributeForm'

function ContributeModal({ isOpen, onClose, user }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:pl-64">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-ls-darker border border-ls-accent rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ls-text-muted hover:text-ls-text transition-colors z-10"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          <h2 className="text-3xl font-bold text-ls-text mb-2">Contribute to PowerScale</h2>
          <p className="text-ls-text-muted mb-6">
            Share your tested laser settings with the community
          </p>

          <ContributeForm user={user} />
        </div>
      </div>
    </div>
  )
}

export default ContributeModal
