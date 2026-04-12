import logoSrc from "@/assets/smart-prof-logo.svg.svg";
import logoWideSrc from "@/assets/smart-prof-logo-wide.svg.svg";

interface SmartProfLogoProps {
  size?: number;
  className?: string;
}

interface SmartProfLogoWideProps {
  height?: number;
  className?: string;
}

export function SmartProfLogo({ size = 48, className = "" }: SmartProfLogoProps) {
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

export function SmartProfLogoWide({ height = 36, className = "" }: SmartProfLogoWideProps) {
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
