import { useLocation, useNavigate, Link } from 'react-router-dom'

function ReviewCartPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cartItems = location.state?.cartItems || []

  const handleExportCLB = () => {
    // TODO: Implement CLB export
    alert('Export to LightBurn Library functionality coming soon!')
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-ls-text mb-6">Review Cart</h1>
        <div className="text-center py-16">
          <svg className="w-24 h-24 mx-auto mb-4 text-ls-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-xl text-ls-text-muted mb-4">Your cart is empty</h2>
          <Link to="/search">
            <button className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-10 px-6 text-sm bg-ls-accent text-white hover:bg-ls-accent-dark shadow-lg">
              Back to Search
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-ls-text">Review Cart & Checkout</h1>
        <Link to="/search">
          <button className="inline-flex items-center text-ls-accent hover:text-ls-accent-dark">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>
        </Link>
      </div>

      <div className="bg-ls-surface border border-ls-accent rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-ls-accent mb-4">
          {cartItems.length} {cartItems.length === 1 ? 'Setting' : 'Settings'} in Cart
        </h2>

        <div className="space-y-3">
          {cartItems.map((setting) => {
            const materialName = setting.MaterialName || setting.material_name || 'Unknown'

            return (
              <div key={setting.ID} className="bg-ls-darker border border-ls-border rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-ls-text font-semibold">
                      {setting.LaserType} {setting.Wattage}W
                    </span>
                    <span className="text-ls-text-muted">•</span>
                    <span className="text-ls-accent font-medium">
                      {materialName}
                    </span>
                  </div>
                  <div className="text-sm text-ls-text-muted">
                    {setting.OperationType} • {parseFloat(setting.MaxPower).toFixed(0)}% @ {parseFloat(setting.Speed).toFixed(0)}mm/s
                  </div>
                </div>
                <button
                  onClick={() => {
                    // TODO: Remove from cart
                    alert('Remove from cart functionality coming soon')
                  }}
                  className="text-ls-red hover:text-ls-red/80 p-2"
                  title="Remove from cart"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleExportCLB}
          className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 h-11 px-6 text-sm bg-ls-accent text-white hover:bg-ls-accent-dark shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to LightBurn Library
        </button>
      </div>
    </div>
  )
}

export default ReviewCartPage
