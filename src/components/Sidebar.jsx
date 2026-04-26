import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  UserCog, Calendar, DollarSign, Zap, Settings,
  ChevronLeft, ChevronRight, Clock, FileSpreadsheet, Activity
} from 'lucide-react';
import { useState } from 'react';
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
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { config, currentUser, processLogout, empresaTipo } = useApp();

  const filteredNavItems = navItems.filter(item => {
    // Filtrar por tipo de negocio
    if (!item.tipos.includes(empresaTipo || 'mixto')) return false;
    // Filtrar por rol
    if (currentUser?.role === 'Cajero') {
      return item.label === 'Punto de Venta' || item.label === 'Clientes' || item.label === 'Asistencia';
    }
    if (currentUser?.role !== 'Administrador' && (item.label === 'Reportes' || item.label === 'Registro Actividad')) {
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
