import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getServers, deleteServer } from '../../api/servers';
import ServerForm from '../../components/ServerForm/ServerForm';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import './ServersPage.css';

const STATUS_MAP = {
  ONLINE:  { label: 'En ligne',   cls: 'status--online'  },
  OFFLINE: { label: 'Hors ligne', cls: 'status--offline' },
  UNKNOWN: { label: 'Inconnu',    cls: 'status--unknown' },
};

function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.UNKNOWN;
  return (
    <span className={`status-badge ${cls}`}>
      <span className="status-badge__dot" />
      {label}
    </span>
  );
}

export default function ServersPage() {
  const { user } = useAuth();

  // Droits selon le rôle — le backend protège déjà les routes, ici c'est l'UX
  const canCreate = ['ADMIN', 'OPERATOR'].includes(user?.role);
  const canEdit   = ['ADMIN', 'OPERATOR'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';
  const hasActions = canEdit || canDelete;

  const [servers,     setServers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [successMsg,  setSuccessMsg]  = useState('');

  // Modale formulaire
  const [formOpen,    setFormOpen]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null); // null = création, objet = édition

  // Dialogue de confirmation de suppression
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getServers()
      .then(setServers)
      .catch((err) => setError(err.response?.data?.error?.message || 'Impossible de charger les serveurs'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit   = (srv) => { setEditTarget(srv); setFormOpen(true); };
  const closeForm  = () => { setFormOpen(false); setEditTarget(null); };

  const handleFormSuccess = (result) => {
    const msg = editTarget
      ? `"${result.hostname}" mis à jour avec succès.`
      : `"${result.hostname}" ajouté avec succès.`;
    closeForm();
    load();
    flash(msg);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteServer(deleteTarget.id);
      setServers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      flash(`"${deleteTarget.hostname}" supprimé.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la suppression');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">

      <div className="page-header">
        <h1>Serveurs{!loading && !error && ` (${servers.length})`}</h1>
        {canCreate && (
          <button className="btn-add" onClick={openCreate}>
            + Ajouter un serveur
          </button>
        )}
      </div>

      {successMsg && (
        <div className="success-banner" role="status">{successMsg}</div>
      )}

      {loading && <div className="state-msg">Chargement…</div>}

      {error && <div className="state-msg state-msg--error">{error}</div>}

      {!loading && !error && servers.length === 0 && (
        <div className="state-msg">
          Aucun serveur enregistré.
          {canCreate && (
            <> <button className="state-link" onClick={openCreate}>Ajouter le premier.</button></>
          )}
        </div>
      )}

      {!loading && !error && servers.length > 0 && (
        <div className="table-wrap">
          <table className="servers-table">
            <thead>
              <tr>
                <th>Hostname</th>
                <th>Adresse IP</th>
                <th>OS</th>
                <th>Tags</th>
                <th>Statut</th>
                {hasActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {servers.map((srv) => (
                <tr key={srv.id}>
                  <td className="col-hostname">{srv.hostname}</td>
                  <td className="col-mono">{srv.ipAddress}</td>
                  <td>{srv.os ?? '—'}</td>
                  <td>
                    <div className="tags">
                      {srv.tags?.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td><StatusBadge status={srv.status} /></td>
                  {hasActions && (
                    <td className="col-actions">
                      {canEdit && (
                        <button
                          className="action-btn action-btn--edit"
                          onClick={() => openEdit(srv)}
                        >
                          Modifier
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="action-btn action-btn--delete"
                          onClick={() => setDeleteTarget(srv)}
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <ServerForm
          server={editTarget}
          onSuccess={handleFormSuccess}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer ce serveur ?"
          message={`Le serveur "${deleteTarget.hostname}" (${deleteTarget.ipAddress}) sera définitivement supprimé. Cette action est irréversible.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
