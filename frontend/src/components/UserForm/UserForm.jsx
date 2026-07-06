import { useState, useEffect, useRef } from 'react';
import { createUser } from '../../api/users';
import './UserForm.css';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function UserForm({ onSuccess, onClose }) {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [role,       setRole]       = useState('VIEWER');
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validate = () => {
    const errs = {};
    if (!email.trim())            errs.email    = "L'email est requis";
    else if (!isValidEmail(email.trim())) errs.email = 'Format invalide';
    if (!password)                 errs.password = 'Le mot de passe est requis';
    else if (password.length < 8)  errs.password = 'Minimum 8 caractères';
    return errs;
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
      const result = await createUser({ email: email.trim(), password, role });
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
          <h2>Ajouter un utilisateur</h2>
          <button className="sf-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <form className="sf-form" onSubmit={handleSubmit} noValidate>
          {apiError && <div className="sf-api-error" role="alert">{apiError}</div>}

          <div className="sf-field">
            <label htmlFor="uf-email">Email <span aria-hidden="true">*</span></label>
            <input
              id="uf-email"
              ref={firstRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
              placeholder="operateur@pfe.local"
              className={errors.email ? 'sf-input--err' : ''}
            />
            {errors.email && <span className="sf-err-msg">{errors.email}</span>}
          </div>

          <div className="sf-field">
            <label htmlFor="uf-password">Mot de passe <span aria-hidden="true">*</span></label>
            <input
              id="uf-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
              placeholder="8 caractères minimum"
              className={errors.password ? 'sf-input--err' : ''}
            />
            {errors.password && <span className="sf-err-msg">{errors.password}</span>}
          </div>

          <div className="sf-field">
            <label htmlFor="uf-role">Rôle</label>
            <select
              id="uf-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="uf-select"
            >
              <option value="VIEWER">Viewer — lecture seule</option>
              <option value="OPERATOR">Operator — gestion des serveurs et installations</option>
            </select>
          </div>

          <div className="sf-actions">
            <button type="button" className="sf-btn sf-btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="sf-btn sf-btn--primary" disabled={submitting}>
              {submitting ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
