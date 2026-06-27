import { useEffect } from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, loading]);

  return (
    <div className="cd-overlay" onClick={!loading ? onCancel : undefined}>
      <div className="cd-card" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="cd-icon" aria-hidden="true">⚠</div>
        <h2 className="cd-title">{title}</h2>
        <p className="cd-message">{message}</p>
        <div className="cd-actions">
          <button className="cd-btn cd-btn--ghost" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button className="cd-btn cd-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}
