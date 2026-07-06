import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Login/LoginPage';
import ServersPage from './pages/Servers/ServersPage';
import MonitoringPage from './pages/Monitoring/MonitoringPage';
import InstallationsPage from './pages/Installations/InstallationsPage';
import UsersPage from './pages/Users/UsersPage';

function ComingSoon({ label }) {
  return (
    <div style={{ padding: '28px 32px', color: '#64748b' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
        {label}
      </h1>
      <p>Page en cours de développement.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/servers" replace />} />
            <Route path="servers"       element={<ServersPage />} />
            <Route path="monitoring"    element={<MonitoringPage />} />
            <Route path="installations" element={<InstallationsPage />} />
            <Route path="users"         element={<UsersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
