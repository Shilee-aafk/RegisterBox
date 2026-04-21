import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import PuntoDeVenta from './pages/PuntoDeVenta';
import Clientes from './pages/Clientes';
import Empleados from './pages/Empleados';
import Citas from './pages/Citas';
import Finanzas from './pages/Finanzas';
import Automatizaciones from './pages/Automatizaciones';
import Configuracion from './pages/Configuracion';
import LoginScreen from './pages/LoginScreen';
import { Toaster, toast } from 'sonner';
import { useApp } from './context/AppContext';

export default function App() {
  const { config, stockAlerts, currentUser } = useApp();
  const prevStockAlertsLen = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    const currentLen = stockAlerts?.length || 0;
    
    if (!mounted.current) {
      if (config?.notifs?.stockBajo && currentLen > 0) {
        const timer = setTimeout(() => {
          toast.warning(`Tienes ${currentLen} producto(s) con stock bajo`, {
            icon: '⚠️', duration: 5000
          });
        }, 1500);
        mounted.current = true;
        prevStockAlertsLen.current = currentLen;
        return () => clearTimeout(timer);
      }
      mounted.current = true;
      prevStockAlertsLen.current = currentLen;
      return;
    }

    if (config?.notifs?.stockBajo && currentLen > 0 && currentLen > prevStockAlertsLen.current) {
      const timer = setTimeout(() => {
        toast.warning(`Tienes ${currentLen} producto(s) con stock bajo`, {
          icon: '⚠️', duration: 5000
        });
      }, 1500);
      prevStockAlertsLen.current = currentLen;
      return () => clearTimeout(timer);
    }
    
    prevStockAlertsLen.current = currentLen;
  }, [config?.notifs?.stockBajo, stockAlerts?.length, currentUser]);

  if (!currentUser) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginScreen />
      </>
    );
  }

  const isCajero = currentUser?.role === 'Cajero';

  return (
    <div className="app-shell">
      <Toaster position="top-right" richColors closeButton />
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <Routes>
          {isCajero ? (
            <>
              <Route path="/" element={<Navigate to="/punto-de-venta" replace />} />
              <Route path="/punto-de-venta" element={<PuntoDeVenta />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="*" element={<Navigate to="/punto-de-venta" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/punto-de-venta" element={<PuntoDeVenta />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/empleados" element={<Empleados />} />
              <Route path="/citas" element={<Citas />} />
              <Route path="/finanzas" element={<Finanzas />} />
              <Route path="/automatizaciones" element={<Automatizaciones />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}
