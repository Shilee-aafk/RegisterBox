import { useApp } from '../context/AppContext';
import { TriangleAlert, X, Info } from 'lucide-react';

export default function ConfirmModal() {
  const { confirmDialog, closeConfirm } = useApp();

  if (!confirmDialog.isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={closeConfirm}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 400, transform: 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        <div style={{ padding: '24px 24px 16px', display: 'flex', gap: 16 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: confirmDialog.isDestructive ? '#fef2f2' : 'var(--accent-blue-light)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {confirmDialog.isDestructive ? (
              <TriangleAlert size={24} color="#ef4444" />
            ) : (
              <Info size={24} color="var(--accent-blue)" />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>{confirmDialog.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              {confirmDialog.message}
            </p>
          </div>
        </div>
        
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', background: 'var(--bg-input)' }}>
          <button 
            className="btn-secondary" 
            onClick={closeConfirm}
            style={{ padding: '8px 16px', fontWeight: 600 }}
          >
            Cancelar
          </button>
          <button 
            className="btn-primary" 
            onClick={() => {
              if (confirmDialog.onConfirm) confirmDialog.onConfirm();
              closeConfirm();
            }}
            style={{ 
              padding: '8px 16px', fontWeight: 600,
              background: confirmDialog.isDestructive ? '#ef4444' : 'var(--accent-blue)',
              color: '#fff', boxShadow: 'none'
            }}
          >
            {confirmDialog.isDestructive ? 'Sí, Desactivar' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
