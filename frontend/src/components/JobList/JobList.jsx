import { useState } from 'react';
import './JobList.css';

const STATUS_LABEL = {
  PENDING: 'En attente',
  RUNNING: 'En cours',
  SUCCESS: 'Réussi',
  FAILED:  'Échoué',
};

function JobStatusBadge({ status }) {
  return (
    <span className={`jsb jsb--${status.toLowerCase()}`}>
      <span className="jsb__dot" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)    return `il y a ${s}s`;
  if (s < 3600)  return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

export default function JobList({ jobs, selectedJobId, onSelect }) {
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterServerId, setFilterServerId] = useState('');

  // Serveurs uniques présents dans les jobs (pour le filtre)
  const uniqueServers = [...new Map(
    jobs.map((j) => [j.serverId, { serverId: j.serverId, hostname: j.hostname }])
  ).values()];

  const filtered = jobs.filter((j) =>
    (filterStatus   ? j.status   === filterStatus   : true) &&
    (filterServerId ? j.serverId === filterServerId : true)
  );

  return (
    <section className="jl-section">
      <div className="jl-header">
        <h2 className="jl-title">
          Jobs d'installation
          <span className="jl-count">
            {filtered.length !== jobs.length
              ? `${filtered.length} / ${jobs.length}`
              : jobs.length}
          </span>
        </h2>
        <div className="jl-filters">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="RUNNING">En cours</option>
            <option value="SUCCESS">Réussis</option>
            <option value="FAILED">Échoués</option>
          </select>
          <select value={filterServerId} onChange={(e) => setFilterServerId(e.target.value)}>
            <option value="">Tous les serveurs</option>
            {uniqueServers.map((s) => (
              <option key={s.serverId} value={s.serverId}>{s.hostname}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="jl-empty">
          {jobs.length === 0
            ? "Aucun job d'installation pour l'instant."
            : 'Aucun job ne correspond aux filtres sélectionnés.'}
        </div>
      ) : (
        <div className="jl-table-wrap">
          <table className="jl-table">
            <thead>
              <tr>
                <th>Logiciel</th>
                <th>Serveur cible</th>
                <th>Statut</th>
                <th>Demandé</th>
                <th>Mis à jour</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const isSelected = selectedJobId === job.id;
                return (
                  <tr
                    key={job.id}
                    className={`jl-row${isSelected ? ' jl-row--selected' : ''}`}
                    onClick={() => onSelect(job)}
                  >
                    <td className="jl-col-sw">{job.softwareKey}</td>
                    <td>
                      <span className="jl-hostname">{job.hostname}</span>
                      <span className="jl-ip">{job.ipAddress}</span>
                    </td>
                    <td><JobStatusBadge status={job.status} /></td>
                    <td className="jl-col-time" title={new Date(job.createdAt).toLocaleString('fr-FR')}>
                      {timeAgo(job.createdAt)}
                    </td>
                    <td className="jl-col-time" title={new Date(job.updatedAt).toLocaleString('fr-FR')}>
                      {timeAgo(job.updatedAt)}
                    </td>
                    <td className="jl-col-action">
                      <span className="jl-btn-view">
                        {isSelected ? '↑ Fermer' : '→ Voir'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
