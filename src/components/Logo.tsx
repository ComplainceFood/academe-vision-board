import logoSrc from "@/assets/smart-prof-logo.png";

interface SmartProfLogoProps {
  size?: number;
  className?: string;
}

export function SmartProfLogo({ size = 36, className = "" }: SmartProfLogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Smart-Prof logo"
      width={size}
      height={size}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
