import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import MarketplaceBand from './MarketplaceBand.jsx';
import { useAuth } from '../lib/auth.jsx';

/**
 * Roles whose dashboard ships its OWN chrome — DashboardShell gives them a
 * sidebar with brand, navigation and log-out. Stacking the marketing header on
 * top of that meant two navigations, two logos and two ways to log out, and the
 * marketing footer under an app screen it has nothing to do with.
 *
 * Admin is deliberately absent: the console renders inside the centred wrapper
 * with no sidebar of its own, so removing the header would strand an admin with
 * no way back to the site.
 */
const ROLES_WITH_OWN_CHROME = ['student', 'parent', 'teacher'];

export default function Layout() {
  const { pathname } = useLocation();
  const { user, isLoading } = useAuth();

  const onDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  // While auth resolves we do not yet know the role. On the dashboard, render
  // bare rather than guessing: showing the header and then removing it is a
  // visible flash on every load, and DashboardPage prints its own loading line.
  const ownsChrome = onDashboard && (isLoading || ROLES_WITH_OWN_CHROME.includes(user?.role));

  if (ownsChrome) return <Outlet />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <MarketplaceBand />
      <Footer />
    </div>
  );
}
