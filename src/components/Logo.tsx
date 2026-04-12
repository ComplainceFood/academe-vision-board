import logoSrc from "@/assets/smart-prof-logo.svg";
import logoWideSrc from "@/assets/smart-prof-logo-wide.svg";

interface SmartProfLogoProps {
  size?: number;
  className?: string;
}

interface SmartProfLogoWideProps {
  height?: number;
  className?: string;
}

export function SmartProfLogo({ size = 50, className = "" }: SmartProfLogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Smart-Prof logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}

export function SmartProfLogoWide({ height = 50, className = "" }: SmartProfLogoWideProps) {
  return (
    <img
      src={logoWideSrc}
      alt="Smart-Prof"
      height={height}
      className={`object-contain ${className}`}
      style={{ height }}
    />
  );
}
