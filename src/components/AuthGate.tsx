import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export function AuthGate() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setStatus(error ? 'error' : 'sent');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900">{t('app.name')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('app.tagline')}</p>
        <hr className="my-6 border-neutral-200" />
        <h2 className="text-lg font-semibold">{t('auth.title')}</h2>
        <p className="text-sm text-neutral-500 mt-1">{t('auth.subtitle')}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">{t('auth.emailLabel')}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-white font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {status === 'sending' ? t('auth.sending') : t('auth.send')}
          </button>

          {status === 'sent' && <p className="text-sm text-green-600">{t('auth.sent')}</p>}
          {status === 'error' && <p className="text-sm text-red-600">{t('auth.error')}</p>}
        </form>
      </div>
    </div>
  );
}
