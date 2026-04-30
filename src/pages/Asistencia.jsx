import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, CheckCircle2, Loader2 } from 'lucide-react';

export default function Asistencia() {
  const { currentUser, marcarAsistencia, obtenerEstadoAsistenciaHoy, logAction } = useApp();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  
  const [actionType, setActionType] = useState('entrada'); // 'entrada', 'salida', 'completado'

  const checkStatus = async () => {
    setLoading(true);
    try {
      const estado = await obtenerEstadoAsistenciaHoy();
      if (estado) {
        setActionType(estado.nextAction);
      } else {
        setActionType('entrada');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, [currentUser]);

  const handleMarcar = async () => {
    if (saving || actionType === 'completado') return;
    setSaving(true);
    setError('');
    try {
      const { action, data } = await marcarAsistencia(currentUser.pin.replace('TEMP-', ''));
      
      let msg = '';
      if (action === 'entrada') {
        msg = `Entrada registrada a las ${data.hora_entrada}`;
        setActionType('salida');
        await logAction('Asistencia Entrada', `Registró entrada al sistema`, 'Asistencia');
      } else if (action === 'salida') {
        msg = `Salida registrada a las ${data.hora_salida}`;
        setActionType('completado');
        await logAction('Asistencia Salida', `Registró salida del sistema`, 'Asistencia');
      } else {
        msg = `Ya completaste tu turno hoy.`;
        setActionType('completado');
      }
      
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Hubo un error al marcar tu asistencia. Intenta nuevamente.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Loader2 size={32} color="var(--accent-blue)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      
      <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <div style={{ width: 80, height: 80, background: 'var(--accent-blue-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Clock size={40} color="var(--accent-blue)" />
        </div>
        
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Asistencia</h2>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32 }}>
          Hola <strong>{currentUser?.name}</strong>, aquí puedes registrar tu asistencia del día.
        </p>

        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ color: '#166534', fontWeight: 600, fontSize: 14 }}>{actionType === 'completado' && !successMsg.includes('Salida registrada') ? 'Turno Completado' : '¡Registro Exitoso!'}</p>
              <p style={{ color: '#15803d', fontSize: 13 }}>{successMsg}</p>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--accent-red)', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>{error}</p>
        )}

        {actionType === 'completado' ? (
           <div style={{ width: '100%', padding: '16px', borderRadius: '14px', background: '#f3f4f6', color: 'var(--text-muted)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle2 size={18} /> Turno Completado
          </div>
        ) : (
          <button 
            onClick={handleMarcar} 
            disabled={saving}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '14px', 
              background: actionType === 'entrada' ? 'var(--accent-blue)' : '#d97706', 
              color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', 
              cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', gap: 8, transition: 'all 0.2s', opacity: saving ? 0.7 : 1 
            }}
          >
            {saving ? 'Registrando...' : actionType === 'entrada' ? 'Marcar Entrada' : 'Marcar Salida'}
            <Clock size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
