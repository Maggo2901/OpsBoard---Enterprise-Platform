import React from 'react';
import UserSelection from './pages/UserSelection';
import KanbanBoard from './pages/KanbanBoard';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import BootOverlay from './components/BootOverlay';

const ENABLE_BOOT_ANIMATION = import.meta.env.VITE_DISABLE_BOOT_ANIMATION !== 'true';

function App() {
  const { user, login, logout, loading } = useAuth();
  React.useEffect(() => {
      if (typeof document !== 'undefined') {
          document.title = 'OpsBoard - Enterprise Platform';
      }
  }, []);

  const [bootState, setBootState] = React.useState(() => (
      ENABLE_BOOT_ANIMATION ? 'showing' : 'done'
  ));

  const handleBootComplete = React.useCallback(() => {
      setBootState('done');
  }, []);

  let content = null;
  if (loading) {
      content = (
          <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">
              <Loader2 className="animate-spin h-8 w-8" />
          </div>
      );
  }
  else if (!user) {
    // When user selects a profile, we call login with a dummy token for now
    content = <UserSelection onSelect={(userData) => login(userData, 'mock-jwt-token')} />;
  } else {
    content = <KanbanBoard currentUser={user} onLogout={logout} />;
  }

  return (
      <div className={bootState === 'done' ? 'app-enter' : 'app-under-boot'}>
          {content}
          {bootState === 'showing' && <BootOverlay onComplete={handleBootComplete} />}
      </div>
  );
}

export default App;
