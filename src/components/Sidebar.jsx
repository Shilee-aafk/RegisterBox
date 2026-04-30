import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  UserCog, Calendar, DollarSign, Zap, Settings,
  ChevronLeft, ChevronRight, Clock, FileSpreadsheet, Activity, MapPin, ChevronDown, Check
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/inventario', label: 'Inventario', icon: Package, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/punto-de-venta', label: 'Punto de Venta', icon: ShoppingCart, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/clientes', label: 'Clientes', icon: Users, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/empleados', label: 'Empleados', icon: UserCog, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/citas', label: 'Citas', icon: Calendar, tipos: ['servicios', 'mixto'] },
  { to: '/finanzas', label: 'Finanzas', icon: DollarSign, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/automatizaciones', label: 'Automatizaciones', icon: Zap, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/asistencia', label: 'Asistencia', icon: Clock, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/registro-actividad', label: 'Registro Actividad', icon: Activity, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/reportes', label: 'Reportes', icon: FileSpreadsheet, tipos: ['retail', 'servicios', 'mixto'] },
  { to: '/locales', label: 'Sucursales', icon: MapPin, tipos: ['retail', 'servicios', 'mixto'], adminOnly: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { config, currentUser, processLogout, empresaTipo, isGlobalAdmin, locales, adminLocalFilter, setAdminLocalFilter } = useApp();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNavItems = navItems.filter(item => {
    // Filtrar por tipo de negocio
    if (!item.tipos.includes(empresaTipo || 'mixto')) return false;
    // Filtrar por rol
    if (currentUser?.role === 'Cajero') {
      return item.label === 'Punto de Venta' || item.label === 'Clientes' || item.label === 'Asistencia';
    }
    if (currentUser?.role !== 'Administrador' && (item.label === 'Reportes' || item.label === 'Registro Actividad' || item.adminOnly)) {
      return false;
    }
    return true;
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: 'transparent', transform: 'translateY(-2px)' }}>
          <img 
            src={config.appearance.modoOscuroAuto ? "icon-negativo256.png" : "icon256.png"} 
            alt="GestorPro" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <h2>{config?.biz?.nombre || 'GestorPro'}</h2>
            <p>Gestión de Negocios</p>
          </div>
        )}
      </div>

      {/* Selector de Local (Solo Admin) */}
      {isGlobalAdmin && !collapsed && (
        <div style={{ padding: '0 12px 16px 12px', borderBottom: '1px solid var(--border-dark)', position: 'relative' }} ref={dropdownRef}>
          <label style={{ fontSize: 10, color: 'var(--text-sidebar)', opacity: 0.7, marginBottom: 4, display: 'block', fontWeight: 600 }}>FILTRAR POR SUCURSAL</label>
          
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', background: 'var(--bg-hover)', color: 'var(--text-sidebar-active)', 
              borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer',
              border: dropdownOpen ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
              transition: 'all 0.2s ease', userSelect: 'none'
            }}
          >
            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminLocalFilter === 'ALL' ? 'Todas las Sucursales' : (locales?.find(l => String(l.id) === String(adminLocalFilter))?.nombre || 'Todas las Sucursales')}
            </span>
            <ChevronDown size={14} style={{ opacity: 0.8, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 12, right: 12, 
              marginTop: 4, background: 'var(--bg-card)', 
              border: '1px solid var(--border)', borderRadius: 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000,
              maxHeight: 250, overflowY: 'auto', padding: 6
            }}>
              <div 
                onClick={() => { setAdminLocalFilter('ALL'); setDropdownOpen(false); }}
                style={{
                  padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: adminLocalFilter === 'ALL' ? 'var(--accent-blue-light)' : 'transparent',
                  color: adminLocalFilter === 'ALL' ? 'var(--accent-blue)' : 'var(--text-primary)',
                  borderRadius: 6, marginBottom: 2, transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = adminLocalFilter === 'ALL' ? 'var(--accent-blue-light)' : '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = adminLocalFilter === 'ALL' ? 'var(--accent-blue-light)' : 'transparent'}
              >
                <span style={{ fontWeight: adminLocalFilter === 'ALL' ? 600 : 500 }}>Todas las Sucursales</span>
                {adminLocalFilter === 'ALL' && <Check size={14} strokeWidth={3} />}
              </div>

              {locales?.map(loc => {
                const isSelected = String(adminLocalFilter) === String(loc.id);
                return (
                  <div 
                    key={loc.id}
                    onClick={() => { setAdminLocalFilter(loc.id); setDropdownOpen(false); }}
                    style={{
                      padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: isSelected ? 'var(--accent-blue-light)' : 'transparent',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                      borderRadius: 6, marginBottom: 2, transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'var(--accent-blue-light)' : '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'var(--accent-blue-light)' : 'transparent'}
                  >
                    <span style={{ fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.nombre}</span>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {filteredNavItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={17} />
            {!collapsed && <span>{label}</span>}
            {!collapsed && badge && <span className="badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {currentUser?.role !== 'Cajero' && (
          <NavLink
            to="/configuracion"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? 'Configuración' : undefined}
          >
            <Settings size={17} />
            {!collapsed && <span>Configuración</span>}
          </NavLink>
        )}

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir' : 'Contraer'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Contraer</span>}
        </button>
      </div>
    </aside>
  );
}
