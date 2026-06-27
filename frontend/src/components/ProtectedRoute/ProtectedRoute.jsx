import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>
        Chargement...
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  return children;
}
