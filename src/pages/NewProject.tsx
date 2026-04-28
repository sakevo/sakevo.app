import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { MAX_BYTES, resizeImageFile } from '@/lib/image';

type ItemType = 'sneaker' | 'clothing';
type Mode = 'custom' | 'restore' | 'both';

export function NewProject() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [itemType, setItemType] = useState<ItemType>('sneaker');
  const [mode, setMode] = useState<Mode>('both');
  const [styleHint, setStyleHint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError(t('upload.tooLarge'));
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t('upload.noImage'));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const resized = await resizeImageFile(file);
      const projectId = crypto.randomUUID();
      const path = `${userId}/${projectId}/original.jpg`;

      const { error: upErr } = await supabase.storage
        .from('uploads')
        .upload(path, resized, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;

      const language = i18n.resolvedLanguage ?? 'de';

      const { error: insErr } = await supabase.from('projects').insert({
        id: projectId,
        user_id: userId,
        item_type: itemType,
        mode,
        language,
        style_hint: styleHint || null,
        original_image_path: path,
        status: 'pending',
      });
      if (insErr) throw insErr;

      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Analyze failed: ${txt}`);
      }

      navigate(`/p/${projectId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t('upload.title')}</h1>
      <p className="text-neutral-500 mt-1">{t('upload.subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <label className="block">
          <div className="rounded-2xl border-2 border-dashed border-neutral-300 hover:border-brand-500 p-8 text-center cursor-pointer transition">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="mx-auto max-h-64 rounded-lg" />
            ) : (
              <div>
                <p className="font-medium text-neutral-700">{t('upload.dropzone')}</p>
                <p className="text-sm text-neutral-500 mt-1">{t('upload.dropzoneHint')}</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          </div>
        </label>

        <div>
          <span className="text-sm font-medium text-neutral-700">{t('upload.itemTypeLabel')}</span>
          <div className="mt-2 flex gap-2">
            {(['sneaker', 'clothing'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setItemType(opt)}
                className={`px-4 py-2 rounded-lg text-sm border ${
                  itemType === opt
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-neutral-700 border-neutral-300'
                }`}
              >
                {t(`upload.itemTypes.${opt}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-neutral-700">{t('upload.modeLabel')}</span>
          <div className="mt-2 flex gap-2 flex-wrap">
            {(['custom', 'restore', 'both'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setMode(opt)}
                className={`px-4 py-2 rounded-lg text-sm border ${
                  mode === opt
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-neutral-700 border-neutral-300'
                }`}
              >
                {t(`upload.modes.${opt}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-neutral-700">{t('upload.styleHintLabel')}</span>
          <input
            type="text"
            value={styleHint}
            onChange={(e) => setStyleHint(e.target.value)}
            placeholder={t('upload.styleHintPlaceholder')}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !file}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-white font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? t('upload.submitting') : t('upload.submit')}
        </button>
      </form>
    </div>
  );
}
