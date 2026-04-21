import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Moon, Bell, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const PAGE_NAMES = {
  '/': 'Dashboard',
  '/inventario': 'Inventario',
  '/punto-de-venta': 'Punto de Venta',
  '/clientes': 'Clientes',
  '/empleados': 'Empleados',
  '/citas': 'Citas',
  '/finanzas': 'Finanzas',
  '/automatizaciones': 'Automatizaciones',
  '/configuracion': 'Configuración',
};

function getDay() {
  return new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
    const title = PAGE_NAMES[pathname] || 'GestorPro';
  const { stockAlerts, citasHoy, config, updateConfig, currentUser, processLogout } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifHistory, setNotifHistory] = useState(() => JSON.parse(localStorage.getItem('gestorpro-notif-history') || '[]'));
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    setNotifHistory(prev => {
      let changed = false;
      let nextHistory = prev.map(n => ({...n}));

      if (config?.notifs?.stockBajo && stockAlerts) {
        const currentStockIds = stockAlerts.map(p => p.id);
        
        nextHistory.forEach(n => {
          if (n._type === 'stock' && n.status === 'active' && !currentStockIds.includes(n._rawId)) {
            n.status = 'resolved';
            changed = true;
          }
        });

        stockAlerts.forEach(p => {
          const hasActive = nextHistory.find(n => n._type === 'stock' && n._rawId === p.id && n.status === 'active');
          if (!hasActive) {
            nextHistory.unshift({
              id: `stock-${p.id}-${Date.now()}`,
              _rawId: p.id,
              _type: 'stock',
              title: `Stock Bajo: ${p.name}`,
              desc: `El producto "${p.name}" tiene solo ${p.stock} unidades. Mínimo recomendado: ${p.min_stock}`,
              time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
              baseColor: 'var(--accent-orange)',
              status: 'active',
              read: false
            });
            changed = true;
          } else if (hasActive.desc !== `El producto "${p.name}" tiene solo ${p.stock} unidades. Mínimo recomendado: ${p.min_stock}`) {
            hasActive.desc = `El producto "${p.name}" tiene solo ${p.stock} unidades. Mínimo recomendado: ${p.min_stock}`;
            hasActive.time = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            changed = true;
          }
        });
      }

      if (config?.notifs?.recordatorios && citasHoy) {
        const currentCitaIds = citasHoy.map(c => c.id);
        
        nextHistory.forEach(n => {
          if (n._type === 'cita' && n.status === 'active' && !currentCitaIds.includes(n._rawId)) {
            n.status = 'resolved';
            changed = true;
          }
        });

        citasHoy.forEach(c => {
          const hasActive = nextHistory.find(n => n._type === 'cita' && n._rawId === c.id && n.status === 'active');
          if (!hasActive) {
            nextHistory.unshift({
              id: `cita-${c.id}-${Date.now()}`,
              _rawId: c.id,
              _type: 'cita',
              title: 'Recordatorio de Cita',
              desc: `${c.client_name || 'Cliente'} tiene una cita hoy a las ${c.time || ''} - ${c.service}`,
              time: c.time || 'Pronto',
              baseColor: 'var(--accent-blue)',
              status: 'active',
              read: false
            });
            changed = true;
          }
        });
      }

      if (nextHistory.length > 50) {
        nextHistory = nextHistory.slice(0, 50);
        changed = true;
      }

      if (changed) {
        localStorage.setItem('gestorpro-notif-history', JSON.stringify(nextHistory));
      }
      return changed ? nextHistory : prev;
    });
  }, [stockAlerts, citasHoy, config?.notifs?.stockBajo, config?.notifs?.recordatorios]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }
    if (showNotifs || showProfile) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifs, showProfile]);

  const unreadNotifs = notifHistory.filter(n => !n.read && n.status === 'active');

  function markAllRead() {
    setNotifHistory(prev => {
      const next = prev.map(n => n.status === 'active' ? { ...n, read: true } : n);
      localStorage.setItem('gestorpro-notif-history', JSON.stringify(next));
      return next;
    });
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        <p>{getDay()}</p>
      </div>

      <div className="topbar-search">
        <Search size={14} color="var(--text-muted)" />
        <input placeholder="Buscar..." aria-label="Buscar" />
      </div>

      <div className="topbar-actions">
        <button
          className="topbar-icon-btn"
          title="Tema"
          onClick={() => updateConfig('appearance', 'modoOscuroAuto', !config?.appearance?.modoOscuroAuto)}
        >
          <Moon size={17} />
        </button>

        <div className="topbar-notif-wrapper" ref={notifRef} style={{ position: 'relative' }}>
          <button
            className={`topbar-icon-btn ${showNotifs ? 'active' : ''}`}
            title="Notificaciones"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={17} />
            {unreadNotifs.length > 0 && <span className="badge-dot">{unreadNotifs.length > 9 ? '+9' : unreadNotifs.length}</span>}
          </button>

          {showNotifs && (
            <div className="notifications-dropdown">
              <div className="notif-header">
                <h3>Notificaciones</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {unreadNotifs.length > 0 && (
                    <button className="notif-mark-read" onClick={markAllRead}>
                      Marcar leídas
                    </button>
                  )}
                </div>
              </div>
              <div className="notif-list">
                {notifHistory.length === 0 ? (
                  <div className="notif-empty">No tienes notificaciones en el registro.</div>
                ) : (
                  notifHistory.map(n => {
                    const isResolved = n.status === 'resolved';
                    const isRead = n.read || isResolved;
                    return (
                      <div
                        className={`notif-item ${isRead ? 'read' : ''} ${isResolved ? 'resolved' : ''}`}
                        key={n.id}
                        onClick={() => {
                          if (isResolved) return;
                          
                          if (!n.read) {
                            setNotifHistory(prev => {
                              const next = prev.map(x => x.id === n.id ? { ...x, read: true } : x);
                              localStorage.setItem('gestorpro-notif-history', JSON.stringify(next));
                              return next;
                            });
                          }
                          setShowNotifs(false);
                          if (n._type === 'stock') navigate(`/inventario?edit=${n._rawId}`);
                          if (n._type === 'cita') navigate(`/citas?edit=${n._rawId}`);
                        }}
                        style={{ cursor: isResolved ? 'default' : 'pointer', opacity: isResolved ? 0.4 : isRead ? 0.6 : 1 }}
                      >
                        <div className="notif-dot" style={{ background: isRead ? '#d1d5db' : n.baseColor }}></div>
                        <div className="notif-content">
                          <h4 style={{ fontWeight: isRead ? 500 : 700 }}>
                            {n.title} {isResolved && <span style={{fontSize: 10, fontWeight: 400, color: 'var(--accent-green)', marginLeft: 6}}>(Resuelto)</span>}
                          </h4>
                          <p>{n.desc}</p>
                          <span className="notif-time">{n.time}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-profile-wrapper" ref={profileRef} style={{ position: 'relative' }}>
          <div className="topbar-avatar" onClick={() => setShowProfile(!showProfile)} style={{ cursor: 'pointer' }}>
            <div className="avatar-circle" style={{ background: currentUser?.role === 'Cajero' ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
              {currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="avatar-info" style={{ marginRight: 8 }}>
              <div className="name">{currentUser?.name || 'Usuario'}</div>
              <div className="role">{currentUser?.role || 'Personal'}</div>
            </div>
          </div>

          {showProfile && (
            <div className="notifications-dropdown" style={{ right: 8, top: 'calc(100% + 10px)', width: 220, padding: 0 }}>
              <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                <div className="avatar-circle" style={{ width: 56, height: 56, fontSize: 20, margin: '0 auto 12px', background: currentUser?.role === 'Cajero' ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                  {currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser?.name}</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{currentUser?.email || 'Sistema Local'}</p>
                <div style={{ display: 'inline-block', background: '#f3f4f6', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, marginTop: 10 }}>
                  Rol: {currentUser?.role}
                </div>
              </div>
              <div style={{ padding: '8px' }}>
                <button 
                  onClick={() => {
                    setShowProfile(false);
                    setShowLogoutConfirm(true);
                  }}
                  style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowLogoutConfirm(false)}>
          <div className="modal" style={{ maxWidth: 360, padding: 32, textAlign: 'center', animation: 'fadeInUp 0.3s ease forwards' }}>
            <div style={{ width: 64, height: 64, background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¿Cerrar Sesión?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Tendrás que volver a ingresar tu PIN numérico para volver a acceder al sistema.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancelar</button>
              <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }} 
                onClick={() => { setShowLogoutConfirm(false); processLogout(); }}
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
