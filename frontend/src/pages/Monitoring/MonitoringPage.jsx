import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getMonitoringStatus, checkAll, checkServer } from '../../api/monitoring';
import PingBadge from '../../components/PingBadge/PingBadge';
import HistoryPanel from '../../components/HistoryPanel/HistoryPanel';
import './MonitoringPage.css';

const REFRESH_INTERVAL = 30; // secondes

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)    return `il y a ${s}s`;
  if (s < 3600)  return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function MonitoringPage() {
  const { user } = useAuth();
  const canCheck = ['ADMIN', 'OPERATOR'].includes(user?.role);

  const [status,      setStatus]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checking,    setChecking]    = useState({});  // { serverId: bool }
  const [selected,    setSelected]    = useState(null); // élément du status sélectionné

  const loadStatus = useCallback(async () => {
    try {
      const data = await getMonitoringStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Impossible de charger le statut');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Auto-refresh — le return () => clearInterval(id) évite la fuite mémoire
  // si l'utilisateur quitte la page ou désactive le toggle
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(loadStatus, REFRESH_INTERVAL * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, loadStatus]);

  const handleCheckAll = async () => {
    setCheckingAll(true);
    setError(null);
    try {
      await checkAll();
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la vérification globale');
    } finally {
      setCheckingAll(false);
    }
  };

  const handleCheckOne = async (e, serverId) => {
    e.stopPropagation(); // ne pas déclencher la sélection de la ligne
    setChecking((p) => ({ ...p, [serverId]: true }));
    setError(null);
    try {
      await checkServer(serverId);
      await loadStatus();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors de la vérification');
    } finally {
      setChecking((p) => ({ ...p, [serverId]: false }));
    }
  };

  const toggleSelected = (srv) =>
    setSelected((prev) => (prev?.serverId === srv.serverId ? null : srv));

  return (
    <div className="page">
      <div className="mon-header">
        <h1>Monitoring{!loading && !error && ` (${status.length})`}</h1>
        <div className="mon-controls">
          <label className="auto-toggle" title={`Rafraîchissement automatique toutes les ${REFRESH_INTERVAL}s`}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto {REFRESH_INTERVAL}s</span>
          </label>
          <button className="mon-btn" onClick={loadStatus}>
            Rafraîchir
          </button>
          {canCheck && (
            <button
              className="mon-btn mon-btn--primary"
              onClick={handleCheckAll}
              disabled={checkingAll}
            >
              {checkingAll ? 'Vérification…' : 'Vérifier tout'}
            </button>
          )}
        </div>
      </div>

      {error   && <div className="state-msg state-msg--error">{error}</div>}
      {loading && <div className="state-msg">Chargement…</div>}

      {!loading && status.length === 0 && (
        <div className="state-msg">
          Aucun serveur enregistré dans le monitoring.
        </div>
      )}

      {!loading && status.length > 0 && (
        <div className="table-wrap">
          <table className="mon-table">
            <thead>
              <tr>
                <th>Serveur</th>
                <th>Adresse IP</th>
                <th>Statut</th>
                <th>Latence</th>
                <th>Dernier check</th>
                <th>Fraîcheur</th>
                {canCheck && <th></th>}
              </tr>
            </thead>
            <tbody>
              {status.map((srv) => {
                const lc = srv.lastCheck;
                const isSelected = selected?.serverId === srv.serverId;
                return (
                  <tr
                    key={srv.serverId}
                    className={`mon-row${isSelected ? ' mon-row--selected' : ''}`}
                    onClick={() => toggleSelected(srv)}
                  >
                    <td className="col-hostname">{srv.hostname}</td>
                    <td className="col-mono">{srv.ipAddress}</td>
                    <td>
                      {lc
                        ? <PingBadge status={lc.status} />
                        : <PingBadge status={null} />
                      }
                    </td>
                    <td className="col-latency">
                      {lc?.latencyMs != null ? `${lc.latencyMs} ms` : '—'}
                    </td>
                    <td title={lc ? fmtDateTime(lc.checkedAt) : ''}>
                      {lc ? fmtDateTime(lc.checkedAt) : '—'}
                    </td>
                    <td className="col-freshness">
                      {lc ? timeAgo(lc.checkedAt) : '—'}
                    </td>
                    {canCheck && (
                      <td className="col-check">
                        <button
                          className="mon-btn-row"
                          onClick={(e) => handleCheckOne(e, srv.serverId)}
                          disabled={!!checking[srv.serverId]}
                          title="Déclencher un check immédiat"
                        >
                          {checking[srv.serverId] ? '…' : 'Vérifier'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <HistoryPanel
          server={selected}
          canCheck={canCheck}
          onCheckDone={loadStatus}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
