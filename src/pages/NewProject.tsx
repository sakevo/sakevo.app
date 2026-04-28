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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-forest-800">{t('upload.title')}</h1>
      <p className="text-forest-500 mt-1">{t('upload.subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-7">
        <label className="block">
          <div
            className={`rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
              previewUrl
                ? 'border-forest-300 bg-white'
                : 'border-cream-300 bg-cream-100/50 hover:border-forest-400 hover:bg-cream-100'
            }`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="mx-auto max-h-72 rounded-2xl object-contain"
              />
            ) : (
              <div className="py-6">
                <UploadIcon />
                <p className="mt-3 font-medium text-forest-700">{t('upload.dropzone')}</p>
                <p className="text-sm text-forest-400 mt-1">{t('upload.dropzoneHint')}</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          </div>
        </label>

        <fieldset>
          <legend className="label">{t('upload.itemTypeLabel')}</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(['sneaker', 'clothing'] as const).map((opt) => (
              <SegmentButton
                key={opt}
                active={itemType === opt}
                onClick={() => setItemType(opt)}
                label={t(`upload.itemTypes.${opt}`)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">{t('upload.modeLabel')}</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['custom', 'restore', 'both'] as const).map((opt) => (
              <SegmentButton
                key={opt}
                active={mode === opt}
                onClick={() => setMode(opt)}
                label={t(`upload.modes.${opt}`)}
              />
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="label">{t('upload.styleHintLabel')}</span>
          <input
            type="text"
            value={styleHint}
            onChange={(e) => setStyleHint(e.target.value)}
            placeholder={t('upload.styleHintPlaceholder')}
            className="input mt-1.5"
          />
        </label>

        {error && (
          <div className="rounded-xl bg-accent-soft/30 px-4 py-3 text-sm text-accent">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !file}
          className="btn-primary w-full !py-3"
        >
          {submitting ? t('upload.submitting') : t('upload.submit')}
        </button>
      </form>
    </div>
  );
}

interface SegmentButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function SegmentButton({ active, onClick, label }: SegmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2.5 text-sm font-medium border transition ${
        active
          ? 'bg-forest-700 text-cream-50 border-forest-700 shadow-soft'
          : 'bg-white text-forest-700 border-cream-200 hover:border-forest-300'
      }`}
    >
      {label}
    </button>
  );
}

function UploadIcon() {
  return (
    <svg
      className="mx-auto text-forest-400"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
