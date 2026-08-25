export function Monogram({ size = 34 }: { size?: number }) {
  return (
    <svg className="monogram" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect className="monogram-plate" width="32" height="32" rx="9.5" />
      <g className="monogram-globe">
        <circle cx="16" cy="16" r="10" />
        <path d="M16 6c-3.2 2.8-4.9 6.4-4.9 10s1.7 7.2 4.9 10c3.2-2.8 4.9-6.4 4.9-10S19.2 8.8 16 6Z" />
        <path d="M6.4 16h19.2" />
      </g>
      <path className="monogram-arrow" d="m12.6 19.4 6.8-6.8m-3.2-.2h3.4v3.4" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="wordmark">
      <Monogram size={compact ? 30 : 34} />
      {!compact && (
        <span className="wordmark-text">
          Export<span>HQ</span>
        </span>
      )}
    </span>
  );
}
