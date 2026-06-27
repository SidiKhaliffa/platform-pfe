import { useState, useEffect, useRef } from 'react';
import { createServer, updateServer } from '../../api/servers';
import './ServerForm.css';

function isValidIp(ip) {
  return (
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip) &&
    ip.split('.').every((n) => parseInt(n, 10) <= 255)
  );
}

// server = null → création, server = objet → édition
export default function ServerForm({ server, onSuccess, onClose }) {
  const isEdit = !!server;

  const [hostname,    setHostname]   = useState(server?.hostname  ?? '');
  const [ipAddress,   setIpAddress]  = useState(server?.ipAddress ?? '');
  const [os,          setOs]         = useState(server?.os        ?? '');
  const [tags,        setTags]       = useState(server?.tags      ?? []);
  const [tagInput,    setTagInput]   = useState('');
  const [errors,      setErrors]     = useState({});
  const [apiError,    setApiError]   = useState('');
  const [submitting,  setSubmitting] = useState(false);

  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!hostname.trim())    errs.hostname  = 'Le hostname est requis';
    if (!ipAddress.trim())   errs.ipAddress = "L'adresse IP est requise";
    else if (!isValidIp(ipAddress.trim())) errs.ipAddress = 'Format invalide (ex : 192.168.1.10)';
    return errs;
  };

  const commitTag = () => {
    const val = tagInput.trim().replace(/,/g, '');
    if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0)
      setTags((prev) => prev.slice(0, -1));
  };

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError('');
    try {
      const payload = {
        hostname:  hostname.trim(),
        ipAddress: ipAddress.trim(),
        ...(os.trim() ? { os: os.trim() } : {}),
        tags,
      };
      const result = isEdit
        ? await updateServer(server.id, payload)
        : await createServer(payload);
      onSuccess(result);
    } catch (err) {
      setApiError(err.response?.data?.error?.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sf-overlay" onClick={onClose}>
      <div className="sf-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

        <div className="sf-header">
          <h2>{isEdit ? 'Modifier le serveur' : 'Ajouter un serveur'}</h2>
          <button className="sf-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <form className="sf-form" onSubmit={handleSubmit} noValidate>
          {apiError && <div className="sf-api-error" role="alert">{apiError}</div>}

          <div className="sf-field">
            <label htmlFor="sf-hostname">Hostname <span aria-hidden="true">*</span></label>
            <input
              id="sf-hostname"
              ref={firstRef}
              type="text"
              value={hostname}
              onChange={(e) => { setHostname(e.target.value); clearError('hostname'); }}
              placeholder="web-01"
              className={errors.hostname ? 'sf-input--err' : ''}
            />
            {errors.hostname && <span className="sf-err-msg">{errors.hostname}</span>}
          </div>

          <div className="sf-field">
            <label htmlFor="sf-ip">Adresse IP <span aria-hidden="true">*</span></label>
            <input
              id="sf-ip"
              type="text"
              value={ipAddress}
              onChange={(e) => { setIpAddress(e.target.value); clearError('ipAddress'); }}
              placeholder="192.168.1.10"
              className={errors.ipAddress ? 'sf-input--err' : ''}
            />
            {errors.ipAddress && <span className="sf-err-msg">{errors.ipAddress}</span>}
          </div>

          <div className="sf-field">
            <label htmlFor="sf-os">Système d'exploitation</label>
            <input
              id="sf-os"
              type="text"
              value={os}
              onChange={(e) => setOs(e.target.value)}
              placeholder="Ubuntu 22.04"
            />
          </div>

          <div className="sf-field">
            <label>Tags</label>
            <div className="sf-tags-box" onClick={() => document.getElementById('sf-tag-input').focus()}>
              {tags.map((t) => (
                <span key={t} className="sf-tag-chip">
                  {t}
                  <button
                    type="button"
                    className="sf-tag-remove"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    aria-label={`Supprimer ${t}`}
                  >×</button>
                </span>
              ))}
              <input
                id="sf-tag-input"
                className="sf-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={commitTag}
                placeholder={tags.length === 0 ? 'Tag + Entrée' : ''}
              />
            </div>
            <span className="sf-hint">Entrée ou virgule pour ajouter un tag. ← pour supprimer le dernier.</span>
          </div>

          <div className="sf-actions">
            <button type="button" className="sf-btn sf-btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="sf-btn sf-btn--primary" disabled={submitting}>
              {submitting ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
