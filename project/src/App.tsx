import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showApp, setShowApp] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white mt-4 text-lg">Loading Lendique...</p>
        </div>
      </div>
    );
  }

  if (user || showApp) {
    return <Dashboard />;
  }

  return (
    <>
      <LandingPage
        onGetStarted={() => {
          if (user) {
            setShowApp(true);
          } else {
            setShowAuth(true);
          }
        }}
      />
      <AuthModal
        isOpen={showAuth}
        onClose={() => {
          setShowAuth(false);
          if (user) {
            setShowApp(true);
          }
        }}
      />
    </>
  );
}

function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;
