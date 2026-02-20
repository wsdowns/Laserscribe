function VoteButtons({ score, userVote, onVote, size = 'default' }) {
  const isSmall = size === 'sm'

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        className={`p-1 rounded transition-colors cursor-pointer ${
          userVote === 1
            ? 'text-ls-green bg-ls-green/15'
            : 'text-ls-text-muted hover:text-ls-green hover:bg-ls-green/10'
        }`}
        title="Upvote - this setting works"
      >
        <svg className={isSmall ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className={`font-semibold min-w-[2ch] text-center ${
        score > 0 ? 'text-ls-green' : score < 0 ? 'text-ls-red' : 'text-ls-text-muted'
      } ${isSmall ? 'text-sm' : 'text-base'}`}>
        {score}
      </span>
      <button
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        className={`p-1 rounded transition-colors cursor-pointer ${
          userVote === -1
            ? 'text-ls-red bg-ls-red/15'
            : 'text-ls-text-muted hover:text-ls-red hover:bg-ls-red/10'
        }`}
        title="Downvote - this setting doesn't work"
      >
        <svg className={isSmall ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}

export default VoteButtons
