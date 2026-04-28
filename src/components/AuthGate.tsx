import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Logo } from './Logo';

export function AuthGate() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorDetail(null);

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setStatus('error');
      setErrorDetail(
        'Supabase env vars are missing in this build. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel and redeploy.'
      );
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      console.error('signInWithOtp error:', error);
      setStatus('error');
      setErrorDetail(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream-50">
      {/* Sanfte Hintergrund-Akzente */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-forest-100/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-soft/20 blur-3xl"
      />

      {/* Splash-Layout: vertikal zentrierte Stack */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center text-center mb-14">
          <Logo size="lg" showTagline />
        </div>

        <div className="w-full max-w-md card p-8 sm:p-10">
          <h2 className="font-display text-xl font-semibold text-forest-800">{t('auth.title')}</h2>
          <p className="mt-1 text-sm text-forest-500">{t('auth.subtitle')}</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="label">{t('auth.emailLabel')}</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="input mt-1.5"
              />
            </label>

            <button type="submit" disabled={status === 'sending'} className="btn-primary w-full">
              {status === 'sending' ? t('auth.sending') : t('auth.send')}
            </button>

            {status === 'sent' && (
              <div className="rounded-xl bg-forest-50 px-4 py-3 text-sm text-forest-700">
                {t('auth.sent')}
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-xl bg-accent-soft/30 px-4 py-3 text-sm text-accent">
                <p className="font-medium">{t('auth.error')}</p>
                {errorDetail && (
                  <p className="mt-1 text-xs font-mono break-all opacity-80">{errorDetail}</p>
                )}
              </div>
            )}
          </form>
        </div>

        <p className="mt-10 text-center text-xs text-forest-400">
          Sustainable customs &amp; restoration · Made with care
        </p>
      </div>
    </div>
  );
}
