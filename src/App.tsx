import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useSession } from '@/lib/session';
import { AuthGate } from '@/components/AuthGate';
import { NavBar } from '@/components/NavBar';
import { Dashboard } from '@/pages/Dashboard';
import { NewProject } from '@/pages/NewProject';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { session, loading } = useSession();
  const { t } = useTranslation();

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">{t('common.loading')}</div>;
  }

  if (!session) {
    return <AuthGate />;
  }

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewProject />} />
        <Route path="/p/:id" element={<ProjectDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
