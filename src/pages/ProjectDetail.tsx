import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  item_type: string;
  mode: string;
  status: string;
  original_image_path: string;
  language: string;
  style_hint: string | null;
  error_message: string | null;
}

interface Analysis {
  result_json: unknown;
  model_used: string;
  created_at: string;
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
      if (cancelled || !p) return;
      setProject(p as Project);

      const { data: signed } = await supabase.storage
        .from('uploads')
        .createSignedUrl(p.original_image_path, 3600);
      if (signed?.signedUrl) setImageUrl(signed.signedUrl);

      const { data: a } = await supabase
        .from('analyses')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (a) setAnalysis(a as Analysis);
    }

    void load();
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  if (!project) {
    return <div className="p-12 text-center text-forest-400">{t('common.loading')}</div>;
  }

  const isLoading = ['pending', 'analyzing', 'rendering'].includes(project.status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/" className="text-sm text-forest-500 hover:text-forest-800 transition">
        ← {t('project.back')}
      </Link>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-forest-500">
            {t('project.originalPhoto')}
          </h2>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="mt-3 rounded-3xl w-full border border-cream-200 bg-cream-100"
            />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip bg-cream-100 text-forest-700">{project.item_type}</span>
            <span className="chip bg-cream-100 text-forest-700">{project.mode}</span>
            {project.style_hint && (
              <span className="chip bg-forest-50 text-forest-700 italic">
                "{project.style_hint}"
              </span>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-forest-500">
            {t('project.analysis')}
          </h2>

          {isLoading && (
            <div className="mt-3 card p-6">
              <div className="flex items-center gap-3">
                <Spinner />
                <div>
                  <p className="text-sm font-medium text-forest-700">{t('project.loading')}</p>
                  <p className="text-xs text-forest-400 mt-0.5">status: {project.status}</p>
                </div>
              </div>
            </div>
          )}

          {project.status === 'error' && (
            <div className="mt-3 rounded-3xl border border-accent-soft bg-accent-soft/20 p-6 text-sm text-accent">
              {project.error_message ?? 'Error'}
            </div>
          )}

          {analysis && (
            <div className="mt-3 card p-5">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-forest-700 select-none">
                  {t('project.rawJson')}{' '}
                  <span className="font-normal text-forest-400">({analysis.model_used})</span>
                </summary>
                <pre className="mt-3 text-xs overflow-auto bg-cream-50 border border-cream-200 p-4 rounded-2xl text-forest-800">
                  {JSON.stringify(analysis.result_json, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin text-forest-500"
      width="20"
      height="20"
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
