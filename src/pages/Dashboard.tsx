import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

interface ProjectRow {
  id: string;
  item_type: string;
  mode: string;
  status: string;
  original_image_path: string;
  created_at: string;
}

const FREE_LIMIT = 3;

export function Dashboard() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [used, setUsed] = useState(0);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const { data: ps } = await supabase
        .from('projects')
        .select('id, item_type, mode, status, original_image_path, created_at')
        .order('created_at', { ascending: false });
      const list = ps ?? [];
      setProjects(list);

      const { data: prof } = await supabase.from('profiles').select('projects_used').single();
      setUsed(prof?.projects_used ?? list.length);

      const paths = list.map((p) => p.original_image_path);
      if (paths.length) {
        const { data: signed } = await supabase.storage
          .from('uploads')
          .createSignedUrls(paths, 3600);
        const map: Record<string, string> = {};
        signed?.forEach((s, i) => {
          if (s.signedUrl) map[list[i].id] = s.signedUrl;
        });
        setThumbs(map);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-12 pb-16">
      {/* Brand-Hero */}
      <div className="flex flex-col items-center text-center pb-10 border-b border-cream-200">
        <Logo size="lg" showTagline />
      </div>

      <header className="mt-10 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest-800">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-forest-500">
            {t('dashboard.freeQuota', { used, limit: FREE_LIMIT })}
          </p>
        </div>
        <Link to="/new" className="btn-primary">
          + {t('nav.newProject')}
        </Link>
      </header>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/p/${p.id}`}
              className="group card overflow-hidden hover:shadow-card transition"
            >
              <div className="aspect-square bg-cream-100 overflow-hidden">
                {thumbs[p.id] ? (
                  <img
                    src={thumbs[p.id]}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cream-400">
                    <PlaceholderIcon />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-forest-500">
                    {p.item_type} · {p.mode}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-xs text-forest-300 mt-2">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="mt-12 card p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center text-forest-500">
        <PlaceholderIcon />
      </div>
      <p className="mt-4 text-forest-600">{t('dashboard.empty')}</p>
      <Link to="/new" className="btn-primary mt-6 inline-flex">
        {t('nav.newProject')}
      </Link>
    </div>
  );
}

function PlaceholderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m21 15-3.5-3.5L9 20" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: 'bg-forest-100 text-forest-700',
    pending: 'bg-cream-100 text-forest-500',
    analyzing: 'bg-cream-200 text-forest-700',
    rendering: 'bg-cream-200 text-forest-700',
    error: 'bg-accent-soft/40 text-accent',
  };
  return <span className={`chip ${map[status] ?? 'bg-cream-100 text-forest-500'}`}>{status}</span>;
}
