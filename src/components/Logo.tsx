interface SmartProfLogoProps {
  size?: number;
  className?: string;
}

export function SmartProfLogo({ size = 36, className = "" }: SmartProfLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-xl ${className}`}
    >
      {/* Background — dark navy */}
      <rect width="100" height="100" rx="14" fill="#1a2744" />

      {/* Subtle grid lines */}
      <line x1="0" y1="20" x2="100" y2="20" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="0" y1="40" x2="100" y2="40" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="0" y1="60" x2="100" y2="60" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="0" y1="80" x2="100" y2="80" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="20" y1="0" x2="20" y2="100" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="40" y1="0" x2="40" y2="100" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="60" y1="0" x2="60" y2="100" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />
      <line x1="80" y1="0" x2="80" y2="100" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.5" />

      {/* === "S" letter — dark blue === */}
      <text
        x="8"
        y="76"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="74"
        fill="#2d4f9e"
        letterSpacing="-2"
      >S</text>

      {/* === "P" letter — cream/off-white, offset right === */}
      <text
        x="46"
        y="76"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="74"
        fill="#e8dcc8"
        letterSpacing="-2"
      >P</text>

      {/* === Network nodes & lines on S === */}
      {/* Lines first (under nodes) */}
      <line x1="18" y1="22" x2="28" y2="35" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <line x1="28" y1="35" x2="14" y2="45" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <line x1="28" y1="35" x2="36" y2="48" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <line x1="14" y1="45" x2="22" y2="58" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <line x1="22" y1="58" x2="36" y2="48" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <line x1="22" y1="58" x2="16" y2="70" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <line x1="36" y1="48" x2="30" y2="62" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <line x1="18" y1="22" x2="32" y2="18" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />

      {/* Nodes on S — white filled */}
      <circle cx="18" cy="22" r="2.2" fill="#ffffff" />
      <circle cx="32" cy="18" r="1.8" fill="#ffffff" />
      <circle cx="28" cy="35" r="2.2" fill="#ffffff" />
      <circle cx="14" cy="45" r="1.8" fill="#ffffff" />
      <circle cx="36" cy="48" r="2.2" fill="#ffffff" />
      <circle cx="22" cy="58" r="2.2" fill="#ffffff" />
      <circle cx="16" cy="70" r="1.8" fill="#ffffff" />
      <circle cx="30" cy="62" r="1.6" fill="#ffffff" />

      {/* === Network nodes & lines on P === */}
      {/* Lines */}
      <line x1="72" y1="18" x2="84" y2="28" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />
      <line x1="84" y1="28" x2="88" y2="42" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />
      <line x1="88" y1="42" x2="80" y2="52" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />
      <line x1="72" y1="18" x2="78" y2="32" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />
      <line x1="78" y1="32" x2="88" y2="42" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />
      <line x1="80" y1="52" x2="72" y2="62" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />
      <line x1="60" y1="22" x2="72" y2="18" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />
      <line x1="60" y1="22" x2="60" y2="38" stroke="#1a2744" strokeOpacity="0.8" strokeWidth="0.8" />

      {/* Nodes on P — dark navy filled with border */}
      <circle cx="72" cy="18" r="2.2" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
      <circle cx="84" cy="28" r="2.2" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
      <circle cx="88" cy="42" r="2.2" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
      <circle cx="80" cy="52" r="2.0" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
      <circle cx="78" cy="32" r="1.8" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
      <circle cx="72" cy="62" r="1.8" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
      <circle cx="60" cy="22" r="1.8" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
      <circle cx="60" cy="38" r="1.8" fill="#1a2744" stroke="#e8dcc8" strokeWidth="1" />
    </svg>
  );
}
