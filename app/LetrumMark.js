export default function LetrumMark({ size = 46 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Letrum"
      style={{ flexShrink: 0, borderRadius: '22%', boxShadow: '0 1px 2px rgba(16,20,42,0.08)' }}
    >
      <rect x="0" y="0" width="100" height="100" rx="22" fill="#FFFFFF" />
      <path d="M16 68 A 34 34 0 0 1 84 68" stroke="#E4E8F2" strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M16 68 A 34 34 0 0 1 84 68" stroke="#4A5FE8" strokeWidth="15" strokeLinecap="round" fill="none" strokeDasharray="45 200" />
      <path d="M16 68 A 34 34 0 0 1 84 68" stroke="#0FA36B" strokeWidth="15" strokeLinecap="round" fill="none" strokeDasharray="30 200" strokeDashoffset="-45" />
      <circle cx="70.2" cy="40.7" r="6" fill="#FFFFFF" stroke="#0FA36B" strokeWidth="3" />
    </svg>
  );
}
