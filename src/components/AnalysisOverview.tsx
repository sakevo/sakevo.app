import { useTranslation } from 'react-i18next';
import type { AnalysisResult } from '@/lib/analysisTypes';

interface AnalysisOverviewProps {
  data: AnalysisResult;
}

export function AnalysisOverview({ data }: AnalysisOverviewProps) {
  const { t } = useTranslation();
  const conditionPct = Math.max(0, Math.min(100, (data.condition.score / 10) * 100));
  const confidencePct = Math.round((data.identification.confidence ?? 0) * 100);

  return (
    <div className="space-y-5">
      {/* Identifikation */}
      <div className="card p-6">
        <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400 mb-3">
          {t('analysis.identification')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat
            label={t('analysis.brand')}
            value={data.identification.brand ?? t('analysis.unknown')}
          />
          <Stat
            label={t('analysis.model')}
            value={data.identification.model ?? t('analysis.unknown')}
          />
          <Stat label={t('analysis.confidence')} value={`${confidencePct}%`} />
        </div>
      </div>

      {/* Zustand */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400">
            {t('analysis.condition')}
          </div>
          <span className="font-display font-semibold text-forest-800">
            {t('analysis.conditionScore', { score: data.condition.score })}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-cream-200 overflow-hidden">
          <div
            className="h-full bg-forest-500 transition-all"
            style={{ width: `${conditionPct}%` }}
          />
        </div>
        {data.condition.issues.length > 0 ? (
          <div className="mt-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400 mb-2">
              {t('analysis.issues')}
            </div>
            <ul className="space-y-1.5">
              {data.condition.issues.map((issue, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-forest-700"
                >
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-forest-500">{t('analysis.noIssues')}</p>
        )}
      </div>

      {/* Materialien */}
      {data.materials.length > 0 && (
        <div className="card p-6">
          <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400 mb-3">
            {t('analysis.materials')}
          </div>
          <ul className="flex flex-wrap gap-2">
            {data.materials.map((m, i) => (
              <li
                key={i}
                className="text-sm px-3 py-1.5 rounded-full bg-cream-100 text-forest-700"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <div className="text-xs text-forest-400">{label}</div>
      <div className="mt-1 font-display font-medium text-forest-800 truncate">{value}</div>
    </div>
  );
}
