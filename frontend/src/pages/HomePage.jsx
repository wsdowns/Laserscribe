import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

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

function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero with branded logos */}
      <section className="relative px-6 py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ls-accent/5 via-transparent to-ls-blue/5" />
        <div className="relative max-w-4xl mx-auto text-center" style={{ animation: 'fade-in-up 0.6s ease-out' }}>

          {/* Laserscribed logo */}
          <div className="mb-10">
            <div className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none">
              <span className="text-white">Laser</span>
              <span className="text-ls-accent">scribed</span>
            </div>
            <div className="mt-1.5 text-sm sm:text-base font-semibold text-gray-500 uppercase" style={{ letterSpacing: '0.35em' }}>
              Precision Engraving Hub
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Hello, <span className="text-ls-accent">World</span>
          </h1>

          {/* Divider */}
          <div className="w-16 h-[3px] bg-gradient-to-r from-ls-accent to-ls-accent-dark rounded-full mx-auto mb-8" />

          {/* PowerScale logo */}
          <div className="mb-6">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none inline-block">
              <span className="text-white">P</span>
              <span className="relative inline-block">
                <span className="invisible">o</span>
                <StarburstSvg />
              </span>
              <span className="text-white">wer</span>
              <span className="text-ls-accent">Scale</span>
            </div>
            <div className="mt-1.5 text-xs sm:text-sm font-semibold text-gray-500 uppercase" style={{ letterSpacing: '0.25em' }}>
              Crowd-Sourced Laser Settings
            </div>
          </div>

          <p className="text-lg text-ls-text-muted max-w-lg mx-auto mb-6">
            <strong className="text-ls-text">PowerScale</strong> is a crowd-sourced, vote-validated database
            of laser engraving and cutting settings. Find the right power, speed, and passes for your machine
            and material — backed by the community.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-ls-accent/10 border border-ls-accent/20 rounded-full mb-10">
            <span className="w-2 h-2 bg-ls-accent rounded-full animate-pulse" />
            <span className="text-sm text-ls-accent font-medium">Under Construction</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search">
              <Button size="lg">
                Search Settings
              </Button>
            </Link>
            <Link to="/contribute">
              <Button variant="outline" size="lg">
                Contribute Your Settings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-ls-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            How <span className="text-ls-accent">PowerScale</span> Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
                title: 'Search',
                desc: 'Find settings by your machine and material. Filter by operation type — cut, engrave, score.',
              },
              {
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Validate',
                desc: 'Vote on settings that work. Upvote accurate settings, downvote bad ones. The cream rises to the top.',
              },
              {
                icon: 'M12 4v16m8-8H4',
                title: 'Contribute',
                desc: 'Share your tested settings with the community. Help others skip the trial-and-error phase.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="w-14 h-14 mx-auto mb-4 bg-ls-accent/10 border border-ls-accent/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-ls-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-ls-text mb-2">{item.title}</h3>
                <p className="text-sm text-ls-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported machines */}
      <section className="px-6 py-20 bg-ls-darker/50 border-t border-ls-border">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Machines We Support</h2>
          <p className="text-ls-text-muted mb-10">CO2, Diode, and Fiber lasers from all major brands</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['xTool', 'Glowforge', 'OmTech', 'Ortur', 'Atomstack', 'Thunder Laser', 'Boss Laser', 'Epilog', 'Creality'].map((brand) => (
              <span
                key={brand}
                className="px-4 py-2 bg-ls-surface border border-ls-border rounded-lg text-sm text-ls-text-muted hover:border-ls-accent/30 hover:text-ls-text transition-all"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-ls-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to stop guessing?</h2>
          <p className="text-ls-text-muted mb-8">
            Join the community and find your settings in seconds, not hours.
          </p>
          <Link to="/search">
            <Button size="lg">
              Open PowerScale
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
