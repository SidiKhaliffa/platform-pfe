import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getUsers } from '../../api/users';
import UserForm from '../../components/UserForm/UserForm';
import './UsersPage.css';

const ROLE_MAP = {
  ADMIN:    { label: 'Admin',    cls: 'role-badge--admin'    },
  OPERATOR: { label: 'Operator', cls: 'role-badge--operator' },
  VIEWER:   { label: 'Viewer',   cls: 'role-badge--viewer'   },
};

function RoleBadge({ role }) {
  const { label, cls } = ROLE_MAP[role] ?? ROLE_MAP.VIEWER;
  return <span className={`role-badge ${cls}`}>{label}</span>;
}

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [formOpen,   setFormOpen]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.response?.data?.error?.message || 'Impossible de charger les utilisateurs'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [load, isAdmin]);

  // Page réservée à l'ADMIN — le backend protège déjà les routes, ici c'est l'UX
  if (!isAdmin) return <Navigate to="/servers" replace />;

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleFormSuccess = (result) => {
    setFormOpen(false);
    load();
    flash(`"${result.email}" créé avec succès.`);
  };

  return (
    <div className="page">

      <div className="page-header">
        <h1>Utilisateurs{!loading && !error && ` (${users.length})`}</h1>
        <button className="btn-add" onClick={() => setFormOpen(true)}>
          + Ajouter un utilisateur
        </button>
      </div>

      {successMsg && (
        <div className="success-banner" role="status">{successMsg}</div>
      )}

      {loading && <div className="state-msg">Chargement…</div>}

      {error && <div className="state-msg state-msg--error">{error}</div>}

      {!loading && !error && users.length === 0 && (
        <div className="state-msg">Aucun utilisateur enregistré.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="table-wrap">
          <table className="servers-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="col-hostname">{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td className="col-mono">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <UserForm
          onSuccess={handleFormSuccess}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
