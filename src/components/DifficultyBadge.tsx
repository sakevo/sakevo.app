import { useTranslation } from 'react-i18next';

interface DifficultyBadgeProps {
  level: 'easy' | 'medium' | 'hard';
}

const styles: Record<DifficultyBadgeProps['level'], string> = {
  easy: 'bg-forest-100 text-forest-700',
  medium: 'bg-cream-200 text-forest-700',
  hard: 'bg-accent-soft/40 text-accent',
};

export function DifficultyBadge({ level }: DifficultyBadgeProps) {
  const { t } = useTranslation();
  const label = t(`difficulty.${level}`, { defaultValue: level });
  return (
    <span className={`chip ${styles[level]}`}>
      <DotIcon level={level} />
      <span className="ml-1.5">{label}</span>
    </span>
  );
}

function DotIcon({ level }: DifficultyBadgeProps) {
  const dots = level === 'easy' ? 1 : level === 'medium' ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1 h-1 rounded-full ${i < dots ? 'bg-current' : 'bg-current opacity-25'}`}
        />
      ))}
    </span>
  );
}
