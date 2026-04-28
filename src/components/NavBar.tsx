import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export function NavBar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  function setLang(lang: string) {
    void i18n.changeLanguage(lang);
  }

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-bold text-lg text-neutral-900">
          {t('app.name')}
        </Link>
        <div className="flex-1" />
        <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900">
          {t('nav.dashboard')}
        </Link>
        <Link
          to="/new"
          className="text-sm rounded-lg bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
        >
          {t('nav.newProject')}
        </Link>
        <select
          value={i18n.resolvedLanguage ?? 'de'}
          onChange={(e) => setLang(e.target.value)}
          className="text-sm rounded border border-neutral-300 px-2 py-1"
          aria-label={t('common.language')}
        >
          <option value="de">DE</option>
          <option value="en">EN</option>
        </select>
        <button onClick={logout} className="text-sm text-neutral-500 hover:text-neutral-900">
          {t('nav.logout')}
        </button>
      </div>
    </nav>
  );
}
