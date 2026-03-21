export default function Logo({ size, color }) {
  var s = size || 24
  var c = color || '#4ade80'
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="16,2 28,9 28,23 16,30 4,23 4,9"
        stroke={c}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <polygon
        points="16,8 23,12 23,20 16,24 9,20 9,12"
        fill={c}
        opacity="0.15"
      />
      <circle cx="16" cy="16" r="3" fill={c} />
      <line x1="16" y1="8" x2="16" y2="13" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="19" x2="16" y2="24" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="12" x2="13.5" y2="14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18.5" y1="17.5" x2="23" y2="20" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="23" y1="12" x2="18.5" y2="14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13.5" y1="17.5" x2="9" y2="20" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
