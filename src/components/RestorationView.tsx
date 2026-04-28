import { useTranslation } from 'react-i18next';
import type { RestorationPlan } from '@/lib/analysisTypes';
import { DifficultyBadge } from './DifficultyBadge';

interface RestorationViewProps {
  plan: RestorationPlan;
}

export function RestorationView({ plan }: RestorationViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="card p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400">
            {t('project.restoration')}
          </div>
          <div className="mt-1 font-display text-lg font-semibold text-forest-800">
            {t('restoration.estimatedTime', { hours: plan.estimated_time_hours })}
          </div>
        </div>
        <DifficultyBadge level={plan.overall_difficulty} />
      </div>

      <ol className="space-y-4">
        {plan.steps.map((step) => (
          <li key={step.step} className="card p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-forest-700 text-cream-50 flex items-center justify-center font-display font-semibold text-sm">
                {step.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400">
                  {t('restoration.step', { n: step.step })}
                </div>
                <h3 className="mt-0.5 font-display text-base font-semibold text-forest-800">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-forest-600 leading-relaxed">{step.instruction}</p>

                {step.materials.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400 mb-1.5">
                      {t('restoration.materials')}
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {step.materials.map((m, i) => (
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

                {step.warning && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-accent-soft/25 border border-accent-soft/40 px-3 py-2.5">
                    <WarningIcon />
                    <div className="text-xs text-accent leading-relaxed">
                      <span className="font-medium uppercase tracking-wider text-[10px] block mb-0.5">
                        {t('restoration.warning')}
                      </span>
                      {step.warning}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      className="flex-shrink-0 mt-0.5 text-accent"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
