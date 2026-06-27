import { useEffect, useRef } from 'react';
import './JobDetail.css';

const STATUS_LABEL = {
  PENDING: 'En attente',
  RUNNING: 'En cours',
  SUCCESS: 'Réussi',
  FAILED:  'Échoué',
};

function fmtDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function JobStatusBadge({ status }) {
  return (
    <span className={`jd-badge jd-badge--${status.toLowerCase()}`}>
      <span className="jd-badge__dot" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function JobDetail({ job, onClose }) {
  const logRef = useRef(null);

  // Auto-scroll vers le bas quand les logs grandissent
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [job.output]);

  const isActive = job.status === 'PENDING' || job.status === 'RUNNING';

  return (
    <div className="jd-panel">

      {/* En-tête */}
      <div className="jd-header">
        <div className="jd-header__left">
          <JobStatusBadge status={job.status} />
          <span className="jd-software">{job.softwareKey}</span>
          <span className="jd-arrow" aria-hidden="true">→</span>
          <span className="jd-server">
            {job.hostname}
            <span className="jd-ip"> ({job.ipAddress})</span>
          </span>
        </div>
        <button className="jd-btn-close" onClick={onClose} aria-label="Fermer le panneau">×</button>
      </div>

      {/* Métadonnées */}
      <div className="jd-meta">
        <span>Demandé le {fmtDateTime(job.createdAt)}</span>
        {job.requestedBy && <span>par <strong>{job.requestedBy}</strong></span>}
        <span>Mis à jour le {fmtDateTime(job.updatedAt)}</span>
      </div>

      {/* Message d'erreur (FAILED seulement) */}
      {job.status === 'FAILED' && job.errorMessage && (
        <div className="jd-error" role="alert">
          <span className="jd-error__label">Erreur</span>
          {job.errorMessage}
        </div>
      )}

      {/* Bloc terminal */}
      <div className="jd-log-section">
        <div className="jd-log-header">
          <span>Logs de sortie</span>
          {isActive && (
            <span className="jd-live-badge" aria-live="polite">EN DIRECT</span>
          )}
        </div>
        <pre
          ref={logRef}
          className="jd-log"
          role="log"
          aria-label="Sortie de l'installation"
        >
          {job.output
            ? job.output
            : isActive
              ? '(en attente de sortie…)'
              : '(aucune sortie enregistrée)'}
        </pre>
      </div>
    </div>
  );
}
