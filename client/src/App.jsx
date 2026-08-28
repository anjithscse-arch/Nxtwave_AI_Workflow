import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore.js';

// Components
import AppShell from './components/AppShell/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';

// Pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import AdminDocuments from './pages/admin/Documents.jsx';
import AdminGuardrailLogs from './pages/admin/GuardrailLogs.jsx';

export function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/chat"
            element={
              <AppShell>
                <Chat />
              </AppShell>
            }
          />
          <Route
            path="/history"
            element={
              <AppShell>
                <History />
              </AppShell>
            }
          />
          <Route
            path="/settings"
            element={
              <AppShell>
                <Settings />
              </AppShell>
            }
          />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute requireRole="admin" />}>
          <Route
            path="/admin/documents"
            element={
              <AppShell>
                <AdminDocuments />
              </AppShell>
            }
          />
          <Route
            path="/admin/guardrail-logs"
            element={
              <AppShell>
                <AdminGuardrailLogs />
              </AppShell>
            }
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
