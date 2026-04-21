import { useState } from 'react';
import {
  Store, Bell, Palette, Shield, Database, Globe,
  CreditCard, HelpCircle, ChevronRight, MessageSquare, FileText, Phone, Check, Save
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

/* ---- Toggle component ---- */
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      onClick={onChange}
      aria-checked={checked}
      role="switch"
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

/* ---- Section wrapper ---- */
function Section({ icon: Icon, title, subtitle, iconColor = 'var(--accent-blue)', iconBg = '#eff6ff', children }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={iconColor} />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700 }}>{title}</p>
          {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

/* ---- Toggle row ---- */
function ToggleRow({ label, desc, checked, onChange, id, noBorder }) {
  const handleChange = () => {
    onChange();
    if (!checked) {
      toast.success(`${label} activado`);
    } else {
      toast(`${label} desactivado`);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: noBorder ? 0 : 16, marginBottom: noBorder ? 0 : 16, borderBottom: noBorder ? 'none' : '1px solid #f3f4f6' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500 }}>{desc}</p>}
      </div>
      <Toggle checked={checked} onChange={handleChange} id={id} />
    </div>
  );
}

export default function Configuracion() {
  const { connected, error, config, updateConfig } = useApp();
  const [saved, setSaved] = useState(false);
  const { biz, notifs, appearance, regional, payments, security } = config;

  function handleSave() {
    setSaved(true);
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)),
      {
        loading: 'Guardando configuración...',
        success: 'Cambios guardados exitosamente',
        error: 'Error al guardar los cambios'
      }
    );
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAction(action) {
    if (action === 'supabase') {
      toast.error('Error de conexión. Verifica las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_KEY.');
    } else if (action === 'password') {
      toast.success('Se ha enviado un correo para restablecer tu contraseña.', {
        icon: '📧'
      });
    }
  }

  return (
    <div className="page-content">

      {/* === Información del Negocio === */}
      <Section icon={Store} title="Información del Negocio" subtitle="Configura los datos básicos de tu negocio">
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Nombre del Negocio</label>
            <input className="form-input" value={biz.nombre} onChange={e => updateConfig('biz', 'nombre', e.target.value)} id="cfg-nombre" />
          </div>
          <div className="form-group">
            <label className="form-label">NIT / Identificación</label>
            <input className="form-input" value={biz.nit} onChange={e => updateConfig('biz', 'nit', e.target.value)} id="cfg-nit" />
          </div>
        </div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input className="form-input" value={biz.telefono} onChange={e => updateConfig('biz', 'telefono', e.target.value)} id="cfg-telefono" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={biz.email} onChange={e => updateConfig('biz', 'email', e.target.value)} id="cfg-email" />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Dirección</label>
          <input className="form-input" value={biz.direccion} onChange={e => updateConfig('biz', 'direccion', e.target.value)} id="cfg-direccion" />
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          id="btn-guardar-cambios"
          style={{ justifyContent: 'center', background: saved ? '#10b981' : undefined, transition: 'background .3s' }}
        >
          {saved ? '✓ Cambios guardados' : 'Guardar Cambios'}
        </button>
      </Section>

      {/* === Notificaciones === */}
      <Section icon={Bell} title="Notificaciones" subtitle="Configura cómo y cuándo recibir alertas">
        <ToggleRow label="Alertas de stock bajo" desc="Recibir notificaciones cuando el inventario esté bajo"
          checked={notifs.stockBajo} onChange={() => updateConfig('notifs', 'stockBajo', !notifs.stockBajo)} id="cfg-notif-stock" />
        <ToggleRow label="Recordatorios de citas" desc="Enviar recordatorios automáticos a clientes"
          checked={notifs.recordatorios} onChange={() => updateConfig('notifs', 'recordatorios', !notifs.recordatorios)} id="cfg-notif-citas" />
        <ToggleRow label="Resumen diario" desc="Recibir un resumen de ventas al final del día"
          checked={notifs.resumenDiario} onChange={() => updateConfig('notifs', 'resumenDiario', !notifs.resumenDiario)} id="cfg-notif-resumen" />
        <ToggleRow label="Alertas de metas" desc="Notificar cuando se alcancen metas de ventas"
          checked={notifs.alertasMetas} onChange={() => updateConfig('notifs', 'alertasMetas', !notifs.alertasMetas)} id="cfg-notif-metas" noBorder />
      </Section>

      {/* === Apariencia === */}
      <Section icon={Palette} title="Apariencia" subtitle="Personaliza el aspecto visual de la aplicación" iconBg="#f5f3ff" iconColor="#8b5cf6">
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Color del Tema Principal</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { id: 'teal', color: '#0d9488', name: 'Turquesa (Original)' },
              { id: 'crema', color: '#ce9c6b', name: 'Beige Dulce' },
              { id: 'rosa_palo', color: '#dca498', name: 'Rosa Palo' },
              { id: 'salvia', color: '#94a896', name: 'Verde Salvia' },
              { id: 'latte', color: '#b08968', name: 'Café Latte' },
              { id: 'arena', color: '#a89f91', name: 'Gris Arena' },
              { id: 'avena', color: '#e2c792', name: 'Crema de Avena' },
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => updateConfig('appearance', 'temaColor', t.id)}
                style={{ 
                  width: 32, height: 32, borderRadius: '50%', background: t.color, 
                  border: 'none', cursor: 'pointer', transition: 'all .2s',
                  boxShadow: (appearance.temaColor || 'teal') === t.id ? `0 0 0 3px #fff, 0 0 0 5px ${t.color}` : 'none',
                  transform: (appearance.temaColor || 'teal') === t.id ? 'scale(1.1)' : 'scale(1)'
                }}
                title={t.name}
              />
            ))}
          </div>
        </div>
        <ToggleRow label="Modo oscuro" desc="Aplicar el filtro de modo oscuro"
          checked={appearance.modoOscuroAuto} onChange={() => updateConfig('appearance', 'modoOscuroAuto', !appearance.modoOscuroAuto)} id="cfg-dark-auto" />
        <ToggleRow label="Animaciones" desc="Habilitar transiciones y animaciones"
          checked={appearance.animaciones} onChange={() => updateConfig('appearance', 'animaciones', !appearance.animaciones)} id="cfg-animaciones" noBorder />
      </Section>

      {/* === Regional === */}
      <Section icon={Globe} title="Regional" subtitle="Configuración de idioma y formato" iconBg="#f0fdf4" iconColor="#10b981">
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Moneda</label>
            <select
              className="form-input"
              value={regional.moneda || 'CLP'}
              onChange={e => updateConfig('regional', 'moneda', e.target.value)}
              id="cfg-moneda"
            >
              <option value="CLP">CLP – Peso Chileno</option>
              <option value="USD">USD – Dólar</option>
              <option value="EUR">EUR – Euro</option>
              <option value="MXN">MXN – Peso Mexicano</option>
              <option value="COP">COP – Peso Colombiano</option>
              <option value="ARS">ARS – Peso Argentino</option>
              <option value="PEN">PEN – Sol Peruano</option>
              <option value="BRL">BRL – Real Brasileño</option>
              <option value="GTQ">GTQ – Quetzal Guatemalteco</option>
              <option value="CRC">CRC – Colón Costarricense</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">IVA (%)</label>
            <input className="form-input" type="number" value={regional.iva} min={0} max={100}
              onChange={e => updateConfig('regional', 'iva', e.target.value)} id="cfg-iva" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Formato de Fecha</label>
            <input className="form-input" value="DD/MM/YYYY" readOnly style={{ background: '#f9fafb', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Zona Horaria</label>
            <input className="form-input" value="America/Santiago" readOnly style={{ background: '#f9fafb', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
          </div>
        </div>
      </Section>

      {/* === Métodos de Pago === */}
      <Section icon={CreditCard} title="Métodos de Pago" subtitle="Configura los métodos de pago aceptados" iconBg="#fff7ed" iconColor="#f97316">
        <ToggleRow label="Efectivo" desc="Aceptar pagos en efectivo"
          checked={payments.efectivo} onChange={() => updateConfig('payments', 'efectivo', !payments.efectivo)} id="cfg-pay-efectivo" />
        <ToggleRow label="Tarjeta de Crédito/Débito" desc="Aceptar pagos con tarjeta"
          checked={payments.tarjeta} onChange={() => updateConfig('payments', 'tarjeta', !payments.tarjeta)} id="cfg-pay-tarjeta" />
        <ToggleRow label="Transferencia Bancaria" desc="Aceptar transferencias"
          checked={payments.transferencia} onChange={() => updateConfig('payments', 'transferencia', !payments.transferencia)} id="cfg-pay-transferencia" noBorder />
      </Section>

      {/* === Base de Datos === */}
      <Section icon={Database} title="Base de Datos" subtitle="Estado de la conexión y almacenamiento" iconBg="#fff7ed" iconColor="#f97316">
        {connected ? (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>Supabase Conectado</p>
            </div>
            <p style={{ fontSize: 13, color: '#064e3b', lineHeight: 1.5 }}>
              La aplicación está conectada a la base de datos en la nube. Los cambios se guardan permanentemente y se sincronizan en tiempo real.
            </p>
          </div>
        ) : (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>{error ? 'Error de conexión' : 'Modo Demo (Sin conexión)'}</p>
            </div>
            <p style={{ fontSize: 13, color: '#92400e', marginBottom: 4, lineHeight: 1.5 }}>
              {error || 'La aplicación está usando datos de demostración locales. Los cambios no se guardarán.'}
            </p>
            <p style={{ fontSize: 12, color: '#b45309', marginBottom: 14, lineHeight: 1.5 }}>
              Verifica las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_KEY.
            </p>
            {!error && (
              <button className="btn-primary" onClick={() => handleAction('supabase')} id="btn-conectar-supabase" style={{ justifyContent: 'center', background: '#f97316' }}>
                Conectar Supabase
              </button>
            )}
          </div>
        )}
      </Section>

      {/* === Seguridad === */}
      <Section icon={Shield} title="Seguridad" subtitle="Configuración de acceso y permisos" iconBg="#fef2f2" iconColor="#ef4444">
        <ToggleRow label="Autenticación de dos factores" desc="Agregar una capa extra de seguridad"
          checked={security.dosFactores} onChange={() => updateConfig('security', 'dosFactores', !security.dosFactores)} id="cfg-2fa" />
        <ToggleRow label="Cierre de sesión automático" desc="Cerrar sesión después de 30 min de inactividad"
          checked={security.cierreSesion} onChange={() => updateConfig('security', 'cierreSesion', !security.cierreSesion)} id="cfg-auto-logout" />
        <div style={{ paddingTop: 4 }}>
          <button className="btn-secondary" onClick={() => handleAction('password')} id="btn-cambiar-contrasena" style={{ fontSize: 13 }}>
            Cambiar Contraseña
          </button>
        </div>
      </Section>

      {/* === Ayuda y Soporte === */}
      <Section icon={HelpCircle} title="Ayuda y Soporte" subtitle="Recursos y asistencia" iconBg="#f0fdf4" iconColor="#10b981">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: MessageSquare, label: 'Chat en vivo', desc: 'Habla con soporte', color: '#3b82f6', bg: '#eff6ff' },
            { icon: FileText, label: 'Documentación', desc: 'Guías y tutoriales', color: '#8b5cf6', bg: '#f5f3ff' },
            { icon: Phone, label: 'Teléfono', desc: '+57 1 234 5678', color: '#10b981', bg: '#ecfdf5' },
          ].map(({ icon: Icon, label, desc, color, bg }) => (
            <button
              key={label}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '18px 12px', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', background: 'var(--bg-card)', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
              onClick={() => toast(`Abriendo ${label.toLowerCase()}...`, { icon: '🚀' })}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

    </div>
  );
}
