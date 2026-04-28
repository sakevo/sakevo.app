import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import type { AnalysisResult, MockupRow } from '@/lib/analysisTypes';
import { AnalysisOverview } from '@/components/AnalysisOverview';
import { CustomIdeaCard } from '@/components/CustomIdeaCard';
import { RestorationView } from '@/components/RestorationView';

interface Project {
  id: string;
  item_type: 'sneaker' | 'clothing';
  mode: 'custom' | 'restore' | 'both';
  status: 'pending' | 'analyzing' | 'rendering' | 'done' | 'error';
  original_image_path: string;
  language: string;
  style_hint: string | null;
  error_message: string | null;
}

interface Analysis {
  result_json: AnalysisResult;
  model_used: string;
  created_at: string;
}

type Tab = 'overview' | 'custom' | 'restoration';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mockups, setMockups] = useState<MockupRow[]>([]);
  const [mockupUrls, setMockupUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
      if (cancelled || !p) return;
      setProject(p as Project);

      if (!imageUrl) {
        const { data: signed } = await supabase.storage
          .from('uploads')
          .createSignedUrl(p.original_image_path, 3600);
        if (signed?.signedUrl && !cancelled) setImageUrl(signed.signedUrl);
      }

      const { data: a } = await supabase
        .from('analyses')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && a) setAnalysis(a as Analysis);

      const { data: m } = await supabase
        .from('mockups')
        .select('*')
        .eq('project_id', id)
        .order('idea_index', { ascending: true });
      if (!cancelled && m) {
        setMockups(m as MockupRow[]);

        const paths = (m as MockupRow[])
          .filter((row) => row.image_path)
          .map((row) => row.image_path as string);
        if (paths.length) {
          const { data: signed } = await supabase.storage
            .from('mockups')
            .createSignedUrls(paths, 3600);
          const map: Record<string, string> = {};
          signed?.forEach((s, i) => {
            if (s.signedUrl) map[paths[i]] = s.signedUrl;
          });
          if (!cancelled) setMockupUrls((prev) => ({ ...prev, ...map }));
        }
      }
    }

    void load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, imageUrl]);

  const result = analysis?.result_json ?? null;
  const isLoading = project ? ['pending', 'analyzing'].includes(project.status) : true;

  // Tabs nur anzeigen, was es im Projekt gibt
  const availableTabs = useMemo<Tab[]>(() => {
    if (!project || !result) return ['overview'];
    const tabs: Tab[] = ['overview'];
    if ((project.mode === 'custom' || project.mode === 'both') && result.custom_ideas.length > 0) {
      tabs.push('custom');
    }
    if ((project.mode === 'restore' || project.mode === 'both') && result.restoration) {
      tabs.push('restoration');
    }
    return tabs;
  }, [project, result]);

  // Falls aktiver Tab verschwindet, auf Overview zurück
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) setActiveTab('overview');
  }, [availableTabs, activeTab]);

  if (!project) {
    return <div className="p-12 text-center text-forest-400">{t('common.loading')}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-forest-500 hover:text-forest-800 transition">
        ← {t('project.back')}
      </Link>

      {/* Hero: Original-Foto + Meta */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="card overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-cream-100" />
          )}
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-forest-400">
              {t('project.originalPhoto')}
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold text-forest-800 capitalize">
              {project.item_type} · {project.mode}
            </h1>
          </div>
          {project.style_hint && (
            <p className="text-sm text-forest-600 italic">"{project.style_hint}"</p>
          )}
          {isLoading && (
            <div className="inline-flex items-center gap-2 chip bg-cream-100 text-forest-700">
              <Spinner />
              {t('project.loading')}
              <span className="opacity-60">· {project.status}</span>
            </div>
          )}
          {project.status === 'error' && (
            <div className="rounded-xl bg-accent-soft/30 px-4 py-3 text-sm text-accent">
              {project.error_message ?? 'Error'}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {result && (
        <>
          <div className="mt-8 flex gap-1 border-b border-cream-200 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-forest-700 text-forest-800'
                    : 'border-transparent text-forest-500 hover:text-forest-800'
                }`}
              >
                {t(`tabs.${tab}`)}
                {tab === 'custom' && (
                  <span className="ml-1.5 text-xs text-forest-400">
                    ({result.custom_ideas.length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === 'overview' && <AnalysisOverview data={result} />}

            {activeTab === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.custom_ideas.map((idea, i) => {
                  const mockup = mockups.find((m) => m.idea_index === i) ?? null;
                  const url = mockup?.image_path ? mockupUrls[mockup.image_path] ?? null : null;
                  return (
                    <CustomIdeaCard
                      key={i}
                      idea={idea}
                      index={i}
                      mockup={mockup}
                      mockupUrl={url}
                    />
                  );
                })}
              </div>
            )}

            {activeTab === 'restoration' && result.restoration && (
              <RestorationView plan={result.restoration} />
            )}
          </div>

          {/* Raw JSON ganz unten als Debug-Hilfe */}
          <details className="mt-12">
            <summary className="cursor-pointer text-xs text-forest-400 hover:text-forest-600 select-none">
              {t('project.rawJson')}
              {analysis && (
                <span className="ml-2 font-mono">({analysis.model_used})</span>
              )}
            </summary>
            <pre className="mt-3 text-xs overflow-auto bg-cream-50 border border-cream-200 p-4 rounded-2xl text-forest-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin text-forest-500" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
