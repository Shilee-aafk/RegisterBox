import { useState, useEffect } from 'react';
import {
  Zap, TrendingUp, Bell, Package, Calendar, Gift,
  Target, DollarSign, TriangleAlert, Info, CheckCircle2, Trash2, Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AUTO_ICONS = {
  package: Package,
  calendar: Calendar,
  gift: Gift,
  target: Target,
  dollar: DollarSign,
};

const ALERT_STYLES = {
  warning: { bg: '#fff7ed', border: '#fed7aa', color: '#92400e', icon: TriangleAlert, iconColor: '#f97316' },
  info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: Info, iconColor: '#3b82f6' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#14532d', icon: CheckCircle2, iconColor: '#16a34a' },
};

// Toggle switch component
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--accent-blue)' : '#d1d5db',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-card)',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left .2s',
      }} />
    </button>
  );
}

export default function Automatizaciones() {
  const { stockAlerts } = useApp();
  const [automations, setAutomations] = useState(() => {
    const saved = localStorage.getItem('gestorpro-automations');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'stock', name: 'Alerta de Stock Crítico', desc: 'Avisa cuando un producto cae por debajo de su cantidad mínima.', icon: 'package', enabled: true, executions: 42, lastRun: 'Hoy, 14:30' },
      { id: 'stagnant', name: 'Productos Estancados', desc: 'Notifica si un producto no ha tenido ventas en 30 días para aplicar descuentos.', icon: 'package', enabled: false, executions: 0, lastRun: null },
      { id: 'appointments', name: 'Recordatorios de Citas', desc: 'Generar alerta destacada para citas programadas el día siguiente.', icon: 'calendar', enabled: true, executions: 12, lastRun: 'Ayer, 18:00' },
      { id: 'loyalty', name: 'Alerta Cliente Frecuente', desc: 'Avisa al cajero al vender a un cliente que ha comprado muchas veces.', icon: 'target', enabled: false, executions: 0, lastRun: null },
      { id: 'close', name: 'Cierre de Caja Automático', desc: 'Generar automáticamente el reporte Excel de ingresos y gastos al final del día.', icon: 'dollar', enabled: true, executions: 5, lastRun: 'Ayer, 22:00' },
      { id: 'goal', name: 'Meta de Ventas Diaria', desc: 'Alerta de felicitación en pantalla cuando se logre el mínimo esperado de meta.', icon: 'gift', enabled: true, executions: 2, lastRun: 'Hace 3 días' },
      { id: 'payroll', name: 'Recordatorio Nómina', desc: 'Aviso con 3 días de anticipación de que termina el mes para pagar empleados.', icon: 'calendar', enabled: false, executions: 0, lastRun: null },
    ];
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    localStorage.setItem('gestorpro-automations', JSON.stringify(automations));
  }, [automations]);

  const active = automations.filter(a => a.enabled).length;
  const totalExec = automations.reduce((s, a) => s + a.executions, 0);
  const unread = alerts.filter(a => !a.read).length;

  function toggleAuto(id) {
    setAutomations(as => as.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  }

  function markAllRead() {
    setAlerts(as => as.map(a => ({ ...a, read: true })));
  }

  function markRead(id) {
    setAlerts(as => as.map(a => a.id === id ? { ...a, read: true } : a));
  }

  function deleteAlert(id) {
    setAlerts(as => as.filter(a => a.id !== id));
  }

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Automatizaciones Activas</p>
            <p className="stat-card-value">{active}/{automations.length}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#eff6ff' }}>
            <Zap size={20} color="#3b82f6" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Total Ejecuciones</p>
            <p className="stat-card-value">{totalExec}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#ecfdf5' }}>
            <TrendingUp size={20} color="#10b981" />
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: unread > 0 ? '#fed7aa' : undefined }}>
          <div className="stat-card-left">
            <p className="stat-card-label">Alertas Sin Leer</p>
            <p className="stat-card-value">{unread}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#fff7ed' }}>
            <Bell size={20} color="#f97316" />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="charts-grid" style={{ marginBottom: 20 }}>
        {/* Left: Automations list */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Zap size={17} color="#3b82f6" />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Automatizaciones</h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Configura acciones automáticas para tu negocio</p>
          </div>

          {automations.map(auto => {
            const Icon = AUTO_ICONS[auto.icon] || Zap;
            return (
              <div key={auto.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid #f9fafb', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <Icon size={18} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{auto.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>{auto.desc}</p>
                  <div style={{ display: 'flex', gap: 14, color: 'var(--text-muted)', fontSize: 11 }}>
                    <span>{auto.executions} ejecuciones</span>
                    {auto.lastRun && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        🕐 Última: {auto.lastRun}
                      </span>
                    )}
                  </div>
                </div>
                <Toggle checked={auto.enabled} onChange={() => toggleAuto(auto.id)} />
              </div>
            );
          })}
        </div>

        {/* Right: Alerts center */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Bell size={16} color="#f97316" />
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Centro de Alertas</h2>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Notificaciones generadas por las automatizaciones</p>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: '#f3f4f6', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
                id="btn-marcar-todas"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stockAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', display: 'block', color: '#10b981' }} />
                <p style={{ fontSize: 14 }}>Todos los productos tienen stock suficiente</p>
              </div>
            ) : (
              stockAlerts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#fff5f5', borderRadius: 10, border: '1px solid #fee2e2' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <Package size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stock actual: {p.stock} | Mínimo: {p.min_stock}</p>
                  </div>
                  <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>⚠️ Crítico</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Info size={16} color="#3b82f6" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Cómo funcionan las automatizaciones</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Las automatizaciones monitorean tu negocio en tiempo real y generan alertas cuando se cumplen ciertas condiciones.
              Por ejemplo, la alerta de stock bajo se activa cuando un producto tiene menos unidades que su mínimo configurado.
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: Package, label: 'Stock Bajo', desc: 'Monitorea niveles de inventario', color: '#3b82f6', bg: '#eff6ff' },
            { icon: Calendar, label: 'Recordatorios', desc: 'Notifica citas próximas', color: '#10b981', bg: '#ecfdf5' },
            { icon: Target, label: 'Metas de Ventas', desc: 'Celebra logros del equipo', color: '#f97316', bg: '#fff7ed' },
          ].map(({ icon: Icon, label, desc, color, bg }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
