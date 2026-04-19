import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  showLabel?: boolean;
  variant?: 'default' | 'sidebar';
}

export function LanguageSwitcher({ showLabel = true, variant = 'default' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const triggerClass = variant === 'sidebar'
    ? "w-[140px] bg-white/10 border-white/20 text-white hover:bg-white/15 focus:ring-white/30"
    : "w-[140px]";

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>{t('settings.language')}</span>
        </div>
      )}
      <Select value={i18n.language?.split('-')[0] || 'en'} onValueChange={handleChange}>
        <SelectTrigger className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
