import { useState, useEffect } from 'react';
import { getHistory, checkServer } from '../../api/monitoring';
import PingBadge from '../PingBadge/PingBadge';
import LatencyChart from '../LatencyChart/LatencyChart';
import './HistoryPanel.css';

const LIMIT = 50;

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function HistoryPanel({ server, canCheck, onCheckDone, onClose }) {
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(0);
  const [hasMore,     setHasMore]     = useState(false);
  const [version,     setVersion]     = useState(0); // force reload after check
  const [checking,    setChecking]    = useState(false);
  const [flashMsg,    setFlashMsg]    = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getHistory(server.serverId, { limit: LIMIT, offset: page * LIMIT })
      .then((data) => {
        if (cancelled) return;
        setHistory(data);
        setHasMore(data.length === LIMIT);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error?.message || 'Erreur de chargement');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [server.serverId, page, version]);

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      const result = await checkServer(server.serverId);
      onCheckDone();
      setPage(0);
      setVersion((v) => v + 1);
      const status = result.status === 'UP'
        ? `En ligne — ${result.latencyMs} ms`
        : 'Hors ligne';
      setFlashMsg(`Check effectué : ${status}`);
      setTimeout(() => setFlashMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erreur lors du check');
    } finally {
      setChecking(false);
    }
  };

  // Transformer l'historique pour le graphe : ordre chronologique, null pour DOWN
  const chartData = [...history]
    .reverse()
    .map((h) => ({
      time:      new Date(h.checkedAt).getTime(),
      ms:        h.status === 'UP' ? h.latencyMs : null,
      status:    h.status,
      checkedAt: h.checkedAt,
      latencyMs: h.latencyMs,
    }));

  const downCount = history.filter((h) => h.status === 'DOWN').length;
  const upCount   = history.filter((h) => h.status === 'UP').length;

  return (
    <div className="hp-panel">

      {/* En-tête */}
      <div className="hp-header">
        <div className="hp-header__title">
          <span className="hp-hostname">{server.hostname}</span>
          <span className="hp-ip">{server.ipAddress}</span>
        </div>
        <div className="hp-header__actions">
          {canCheck && (
            <button className="hp-btn-check" onClick={handleCheck} disabled={checking}>
              {checking ? 'Vérification…' : 'Vérifier maintenant'}
            </button>
          )}
          <button className="hp-btn-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
      </div>

      {flashMsg && <div className="hp-flash" role="status">{flashMsg}</div>}
      {error    && <div className="hp-error" role="alert">{error}</div>}

      {loading && <div className="hp-loading">Chargement de l'historique…</div>}

      {!loading && history.length === 0 && (
        <div className="hp-empty">
          Aucun check enregistré pour ce serveur.
          {canCheck && ' Cliquez sur "Vérifier maintenant" pour lancer le premier.'}
        </div>
      )}

      {!loading && history.length > 0 && (
        <>
          {/* Résumé */}
          <div className="hp-summary">
            <span className="hp-summary__item hp-summary__item--up">{upCount} UP</span>
            <span className="hp-summary__item hp-summary__item--down">{downCount} DOWN</span>
            <span className="hp-summary__item">
              {LIMIT} derniers checks — page {page + 1}
            </span>
          </div>

          {/* Graphe */}
          <LatencyChart data={chartData} />

          {/* Pagination */}
          <div className="hp-pagination">
            <button
              className="hp-btn-page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Plus récents
            </button>
            <button
              className="hp-btn-page"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Plus anciens →
            </button>
          </div>

          {/* Tableau */}
          <div className="hp-table-wrap">
            <table className="hp-table">
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Statut</th>
                  <th>Latence</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className={h.status === 'DOWN' ? 'hp-row--down' : ''}>
                    <td className="col-mono">{fmtDateTime(h.checkedAt)}</td>
                    <td><PingBadge status={h.status} /></td>
                    <td>{h.latencyMs != null ? `${h.latencyMs} ms` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
