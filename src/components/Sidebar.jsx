import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  UserCog, Calendar, DollarSign, Zap, Settings,
  ChevronLeft, ChevronRight, Box
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/punto-de-venta', label: 'Punto de Venta', icon: ShoppingCart },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/empleados', label: 'Empleados', icon: UserCog },
  { to: '/citas', label: 'Citas', icon: Calendar },
  { to: '/finanzas', label: 'Finanzas', icon: DollarSign },
  { to: '/automatizaciones', label: 'Automatizaciones', icon: Zap },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { config, currentUser, processLogout } = useApp();

  const filteredNavItems = navItems.filter(item => {
    if (currentUser?.role === 'Cajero') {
      return item.label === 'Punto de Venta' || item.label === 'Clientes';
    }
    return true;
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <img 
            src={config.appearance.modoOscuroAuto ? '/icon-negativo.png' : '/icon.png'} 
            alt="GestorPro" 
            style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'contain' }} 
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
