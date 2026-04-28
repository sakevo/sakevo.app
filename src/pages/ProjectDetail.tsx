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
    return <div className="p-8 text-center text-neutral-500">{t('common.loading')}</div>;
  }

  const isLoading = ['pending', 'analyzing', 'rendering'].includes(project.status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← {t('project.back')}
      </Link>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
            {t('project.originalPhoto')}
          </h2>
          {imageUrl && (
            <img src={imageUrl} alt="" className="mt-2 rounded-2xl w-full border border-neutral-200" />
          )}
          <div className="mt-3 text-sm text-neutral-600">
            <div>
              {project.item_type} · {project.mode}
            </div>
            {project.style_hint && <div className="italic">"{project.style_hint}"</div>}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
            {t('project.analysis')}
          </h2>

          {isLoading && (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="animate-pulse text-neutral-500">{t('project.loading')}</div>
              <div className="text-xs text-neutral-400 mt-2">status: {project.status}</div>
            </div>
          )}

          {project.status === 'error' && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {project.error_message ?? 'Error'}
            </div>
          )}

          {analysis && (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  {t('project.rawJson')} ({analysis.model_used})
                </summary>
                <pre className="mt-3 text-xs overflow-auto bg-neutral-50 p-3 rounded-lg">
                  {JSON.stringify(analysis.result_json, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
