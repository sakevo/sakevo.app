import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Logo } from './Logo';

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
    <nav className="sticky top-0 z-10 border-b border-cream-200 bg-cream-50/85 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
        <Link to="/" aria-label="SAKEVO Home">
          <Logo size="sm" />
        </Link>

        <div className="flex-1" />

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `text-sm transition ${
              isActive ? 'text-forest-800 font-medium' : 'text-forest-500 hover:text-forest-800'
            }`
          }
        >
          {t('nav.dashboard')}
        </NavLink>

        <Link to="/new" className="btn-primary !py-1.5 !px-4 text-sm">
          {t('nav.newProject')}
        </Link>

        <select
          value={i18n.resolvedLanguage ?? 'de'}
          onChange={(e) => setLang(e.target.value)}
          className="text-xs rounded-full border border-cream-200 bg-white px-2 py-1 text-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
          aria-label={t('common.language')}
        >
          <option value="de">DE</option>
          <option value="en">EN</option>
        </select>

        <button
          onClick={logout}
          className="text-xs text-forest-400 hover:text-forest-700 transition"
        >
          {t('nav.logout')}
        </button>
      </div>
    </nav>
  );
}
