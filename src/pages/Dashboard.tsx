import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <span className="text-sm text-neutral-500">
          {t('dashboard.freeQuota', { used, limit: FREE_LIMIT })}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="mt-12 text-center text-neutral-500">{t('dashboard.empty')}</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/p/${p.id}`}
              className="rounded-2xl bg-white border border-neutral-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="aspect-square bg-neutral-100">
                {thumbs[p.id] && (
                  <img src={thumbs[p.id]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium uppercase tracking-wide text-neutral-500">
                    {p.item_type} · {p.mode}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-xs text-neutral-400 mt-1">
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: 'bg-green-100 text-green-700',
    pending: 'bg-neutral-100 text-neutral-600',
    analyzing: 'bg-blue-100 text-blue-700',
    rendering: 'bg-purple-100 text-purple-700',
    error: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] ?? ''}`}>
      {status}
    </span>
  );
}
