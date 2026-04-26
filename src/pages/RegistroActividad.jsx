import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, Clock, Trash2, Edit3, PlusCircle, CheckCircle, Search, Calendar as CalendarIcon, Loader2 } from 'lucide-react';

export default function RegistroActividad() {
  const { currentUser, obtenerLogs } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Solo Admin
  if (currentUser?.role !== 'Administrador') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await obtenerLogs(200); // Traer ultimos 200
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.empleados?.name || '').toLowerCase().includes(filter.toLowerCase()) ||
    l.accion.toLowerCase().includes(filter.toLowerCase()) ||
    l.modulo.toLowerCase().includes(filter.toLowerCase()) ||
    (l.detalle || '').toLowerCase().includes(filter.toLowerCase())
  );

  const getActionIcon = (accion) => {
    const a = accion.toLowerCase();
    if (a.includes('eliminar') || a.includes('borrar')) return <Trash2 size={16} color="#ef4444" />;
    if (a.includes('editar') || a.includes('modificar') || a.includes('actualizar')) return <Edit3 size={16} color="#f59e0b" />;
    if (a.includes('agregar') || a.includes('crear') || a.includes('nuevo')) return <PlusCircle size={16} color="#10b981" />;
    if (a.includes('venta') || a.includes('completar')) return <CheckCircle size={16} color="#3b82f6" />;
    return <Activity size={16} color="#6b7280" />;
  };

  const getActionColor = (accion) => {
    const a = accion.toLowerCase();
    if (a.includes('eliminar') || a.includes('borrar')) return '#fef2f2';
    if (a.includes('editar') || a.includes('modificar') || a.includes('actualizar')) return '#fffbeb';
    if (a.includes('agregar') || a.includes('crear') || a.includes('nuevo')) return '#ecfdf5';
    if (a.includes('venta') || a.includes('completar')) return '#eff6ff';
    return '#f9fafb';
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Registro de Actividades</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Historial de acciones (Audit Log)</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={loadLogs} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Clock size={16} />} 
          Actualizar
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, margin: 0, maxWidth: 400 }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar por empleado, acción o detalle..." 
              value={filter} 
              onChange={e => setFilter(e.target.value)} 
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={30} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
            <p>Cargando registros...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
            <p>No se encontraron actividades.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, width: 150 }}>Fecha y Hora</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Usuario</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Módulo</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Acción</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const date = new Date(log.created_at);
                  const dateStr = date.toLocaleDateString();
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CalendarIcon size={12} /> {dateStr}
                          <span style={{ marginLeft: 6, color: 'var(--text-primary)', fontWeight: 500 }}>{timeStr}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                        {log.empleados?.name || 'Sistema'}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{log.empleados?.role || ''}</div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{log.modulo}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: getActionColor(log.accion), padding: '4px 10px', borderRadius: 20, fontWeight: 600, fontSize: 12 }}>
                          {getActionIcon(log.accion)} {log.accion}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                        {log.detalle}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
