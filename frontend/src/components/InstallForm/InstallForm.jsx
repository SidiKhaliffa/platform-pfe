import { useState } from 'react';
import './InstallForm.css';

export default function InstallForm({ servers, catalog, onInstall, submitting }) {
  const [serverId,    setServerId]    = useState('');
  const [softwareKey, setSoftwareKey] = useState('');
  const [error,       setError]       = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!serverId)    { setError('Choisissez un serveur cible.'); return; }
    if (!softwareKey) { setError('Choisissez un logiciel à installer.'); return; }
    onInstall(serverId, softwareKey);
  };

  return (
    <div className="if-card">
      <h2 className="if-title">Nouvelle installation</h2>

      <form className="if-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="if-error" role="alert">{error}</div>}

        <div className="if-field">
          <label htmlFor="if-server">Serveur cible</label>
          <select
            id="if-server"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
            className={!serverId ? 'if-select--empty' : ''}
          >
            <option value="">— Choisir un serveur —</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.hostname}  ({s.ipAddress})
              </option>
            ))}
          </select>
        </div>

        <div className="if-field">
          <label>Logiciel à installer</label>
          <div className="if-catalog" role="listbox" aria-label="Catalogue de logiciels">
            {catalog.map((item) => {
              const selected = softwareKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`if-card-item${selected ? ' if-card-item--selected' : ''}`}
                  onClick={() => setSoftwareKey(selected ? '' : item.key)}
                >
                  <span className="if-card-item__name">{item.displayName}</span>
                  <span className="if-card-item__desc">{item.description}</span>
                  {selected && <span className="if-card-item__check" aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="if-actions">
          <button type="submit" className="if-btn-submit" disabled={submitting || !serverId || !softwareKey}>
            {submitting ? 'Lancement…' : 'Installer'}
          </button>
        </div>
      </form>
    </div>
  );
}
