interface SmartProfLogoProps {
  size?: number;
  className?: string;
}

export function SmartProfLogo({ size = 36, className = "" }: SmartProfLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square background */}
      <rect width="36" height="36" rx="9" fill="hsl(var(--primary))" />

      {/* Open book — left page */}
      <path
        d="M10 12C12 11 15.5 11 18 12V26C15.5 25 12 25 10 26V12Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Open book — right page */}
      <path
        d="M26 12C24 11 20.5 11 18 12V26C20.5 25 24 25 26 26V12Z"
        fill="white"
        fillOpacity="0.65"
      />
      {/* Book spine */}
      <line
        x1="18"
        y1="12"
        x2="18"
        y2="26"
        stroke="hsl(var(--primary))"
        strokeWidth="0.75"
        strokeOpacity="0.4"
      />

      {/* Sparkle — top right accent */}
      <path
        d="M27 7 L27.55 8.8 L29.4 9.35 L27.55 9.9 L27 11.7 L26.45 9.9 L24.6 9.35 L26.45 8.8 Z"
        fill="white"
        fillOpacity="0.85"
      />
    </svg>
  );
}
