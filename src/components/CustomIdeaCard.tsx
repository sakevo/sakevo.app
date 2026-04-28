import { useTranslation } from 'react-i18next';
import type { CustomIdea, MockupRow } from '@/lib/analysisTypes';
import { ColorSwatches } from './ColorSwatches';
import { DifficultyBadge } from './DifficultyBadge';

interface CustomIdeaCardProps {
  idea: CustomIdea;
  index: number;
  mockup: MockupRow | null;
  mockupUrl: string | null;
}

export function CustomIdeaCard({ idea, index, mockup, mockupUrl }: CustomIdeaCardProps) {
  const { t } = useTranslation();

  return (
    <article className="card overflow-hidden flex flex-col">
      {/* Mockup-Slot */}
      <div className="relative aspect-square bg-cream-100">
        {mockupUrl ? (
          <img
            src={mockupUrl}
            alt={idea.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <MockupPlaceholder
            status={mockup?.status ?? 'pending'}
            colors={idea.colors}
            errorMessage={mockup?.error_message ?? null}
          />
        )}
        <div className="absolute top-3 left-3">
          <span className="chip bg-white/90 backdrop-blur text-forest-700 shadow-soft">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Inhalt */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        <header className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-forest-800 leading-tight">
            {idea.title}
          </h3>
          <DifficultyBadge level={idea.difficulty} />
        </header>

        <p className="text-sm text-forest-600 leading-relaxed">{idea.description}</p>

        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400 mb-2">
            {t('idea.colors')}
          </div>
          <ColorSwatches colors={idea.colors} size="sm" />
        </div>

        {idea.materials_to_use.length > 0 && (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400 mb-2">
              {t('idea.materials')}
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {idea.materials_to_use.map((m, i) => (
                <li
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-cream-100 text-forest-700"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

interface MockupPlaceholderProps {
  status: 'pending' | 'done' | 'error';
  colors: string[];
  errorMessage: string | null;
}

function MockupPlaceholder({ status, colors, errorMessage }: MockupPlaceholderProps) {
  const { t } = useTranslation();

  if (status === 'error') {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
        <p className="text-xs text-accent">{errorMessage ?? t('idea.mockupError')}</p>
      </div>
    );
  }

  // pending — zeige Color-Gradient als Vorschau, bis Mockup fertig ist
  const validColors = colors.filter((c) => /^#[0-9a-fA-F]{3,8}$/.test(c));
  const gradient =
    validColors.length >= 2
      ? `linear-gradient(135deg, ${validColors.join(', ')})`
      : validColors[0] ?? '#ebe3c8';

  return (
    <div
      className="absolute inset-0 flex items-end justify-center p-4"
      style={{ backgroundImage: gradient }}
    >
      <div className="rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-forest-700 flex items-center gap-2">
        <Spinner />
        {t('idea.mockupPending')}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin text-forest-500"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
