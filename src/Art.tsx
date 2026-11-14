export function OrbitArt() {
  return (
    <div className="orbit-art" aria-hidden="true">
      <svg viewBox="0 0 480 360">
        <defs>
          <linearGradient id="orb" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffae86" />
            <stop offset="1" stopColor="#ff7b8c" />
          </linearGradient>
        </defs>
        <ellipse
          cx="260"
          cy="190"
          rx="178"
          ry="119"
          fill="none"
          stroke="#9875e8"
          strokeDasharray="4 8"
          transform="rotate(-24 260 190)"
        />
        <ellipse
          cx="260"
          cy="190"
          rx="149"
          ry="88"
          fill="none"
          stroke="#c3aaf1"
          transform="rotate(-24 260 190)"
        />
        <circle cx="260" cy="190" r="80" fill="#7945dc" />
        <path d="M211 180h31v-34h31v-33h31v113h-93z" fill="#d9fd5e" />
        <path
          d="m229 158 53-47h-29m29 0v29"
          stroke="#2c164d"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="115" cy="248" r="42" fill="url(#orb)" />
        <path
          d="m100 247 11 11 20-24"
          stroke="#6b2c3a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="393" cy="125" r="30" fill="#d9fd5e" />
        <path
          d="m393 110 4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1z"
          fill="#4e2b83"
        />
        <path d="m118 75 6 14 14 5-14 5-6 14-5-14-14-5 14-5z" fill="#f9fcf0" />
        <path d="m376 282 4 9 10 4-10 3-4 10-3-10-10-3 10-4z" fill="#7945dc" />
        <circle cx="350" cy="53" r="6" fill="#ff947d" />
        <circle cx="175" cy="305" r="5" fill="#9670dd" />
      </svg>
      <div className="orbit-note note-top">
        <span className="note-dot" />A skill. An opportunity.
        <strong>A whole new chapter.</strong>
      </div>
      <div className="orbit-note note-bottom">
        <span className="note-check">✓</span>
        <div>
          More than a certificate.<strong>A future taking shape.</strong>
        </div>
      </div>
      <span className="handwritten">possibility looks good on you ↗</span>
    </div>
  );
}
export function Spark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m50 0 9 31 27-17-17 27 31 9-31 9 17 27-27-17-9 31-9-31-27 17 17-27-31-9 31-9-17-27 27 17z" />
    </svg>
  );
}
