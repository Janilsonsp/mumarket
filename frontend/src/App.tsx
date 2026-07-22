import { useState } from 'react';
import { AuthProvider, SocketProvider, FilterProvider, useAuth } from '@/contexts';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FiltersPage } from './pages/FiltersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

type Page = 'dashboard' | 'filters' | 'settings' | 'admin';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-primary/10" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Check if user is approved
  if (user.role !== 'admin' && !user.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Conta aguardando aprovacao</h1>
          <p className="text-muted-foreground mb-4">
            Sua conta foi criada com sucesso! Aguarde o administrador aprovar seu acesso.
          </p>
          <p className="text-sm text-muted-foreground">
            Voce pode fechar esta pagina e tentar novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <SocketProvider>
      <FilterProvider>
        <div>
          <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-full px-2 py-1 flex gap-1 shadow-lg">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('filters')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentPage === 'filters'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Filtros
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentPage === 'settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Config
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentPage('admin')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Admin
              </button>
            )}
          </nav>

          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'filters' && <FiltersPage />}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'admin' && isAdmin && <AdminPage />}

          <footer className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 text-xs text-muted-foreground/50">
            v1.1.0
          </footer>
        </div>
      </FilterProvider>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
