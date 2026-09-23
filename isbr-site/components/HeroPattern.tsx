export default function HeroPattern() {
  return (
    <svg
      className="hero__pattern"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="isbr-star"
          x="0"
          y="0"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          <rect
            x="8"
            y="8"
            width="34"
            height="34"
            fill="none"
            stroke="#d4b15a"
            strokeWidth="0.75"
          />
          <rect
            x="8"
            y="8"
            width="34"
            height="34"
            fill="none"
            stroke="#d4b15a"
            strokeWidth="0.75"
            transform="rotate(45 25 25)"
          />
        </pattern>
        <radialGradient id="isbr-fade" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="isbr-mask">
          <rect width="100%" height="100%" fill="url(#isbr-fade)" />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#isbr-star)"
        opacity="0.14"
        mask="url(#isbr-mask)"
      />
    </svg>
  );
}
