import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Building2, Mail, Lock, ArrowRight, CheckCircle, ArrowLeft, ShoppingBag, Scissors, Store } from 'lucide-react';

export default function RegisterPage({ onBack }) {
  const { config } = useApp();
  const [form, setForm] = useState({ nombre: '', tipo: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!form.nombre.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }
    if (!form.tipo) {
      setError('Selecciona el tipo de negocio.');
      return;
    }

    setLoading(true);
    try {
      // Registrar usuario en Supabase Auth con el nombre de empresa en los metadatos.
      // El trigger de Supabase leerá "nombre_empresa" y creará la empresa automáticamente.
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { nombre_empresa: form.nombre.trim(), tipo_empresa: form.tipo }
        }
      });

      if (signUpError) throw signUpError;
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    }
    setLoading(false);
  }

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  if (success) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 48, maxWidth: 420, width: '90%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,.08)' }}>
          <div style={{ width: 72, height: 72, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={36} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>¡Registro Exitoso!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
            Hemos enviado un correo de confirmación a <strong>{form.email}</strong>.<br />
            Haz clic en el enlace del correo y luego podrás ingresar al sistema.
          </p>
          <button onClick={onBack} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12 }}>
            Ir al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--bg-app)', color: 'var(--text-primary)', overflow: 'hidden' }}>

      {/* Left Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-sidebar)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <img src={config.appearance?.modoOscuroAuto ? "icon-negativo256.png" : "icon256.png"} alt="Logo" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 16 }} />
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{config?.biz?.nombre || 'GestorPro'}</h1>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 15 }}>Sistema Inteligente de Gestión</p>

        <div style={{ marginTop: 48, maxWidth: 260, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, lineHeight: 1.6 }}>
            Al registrarte, tu negocio obtendrá un espacio privado y seguro. Nadie más podrá ver tu información.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: 480, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, boxShadow: '-5px 0 25px rgba(0,0,0,.05)' }}>

        <div style={{ width: 64, height: 64, background: 'var(--accent-blue-light)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Building2 size={30} color="var(--accent-blue)" />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Registrar Nuevo Negocio</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center', maxWidth: 300, lineHeight: 1.4 }}>
          Crea tu cuenta en segundos. Sin tarjeta de crédito requerida.
        </p>

        <form onSubmit={handleRegister} style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nombre del negocio */}
          <div className="form-group">
            <label className="form-label">Nombre del Negocio</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Ej: Peluquería Estilo & Arte"
                value={form.nombre}
                onChange={e => f('nombre', e.target.value)}
                style={{ paddingLeft: 42 }}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Tipo de negocio */}
          <div className="form-group">
            <label className="form-label">Tipo de Negocio</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { value: 'retail', label: 'Tienda', desc: 'Venta de productos', Icon: ShoppingBag, color: '#3b82f6' },
                { value: 'servicios', label: 'Servicios', desc: 'Peluquería, consultas...', Icon: Scissors, color: '#8b5cf6' },
                { value: 'mixto', label: 'Mixto', desc: 'Productos + servicios', Icon: Store, color: '#10b981' },
              ].map(opt => {
                const active = form.tipo === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => f('tipo', opt.value)}
                    style={{
                      padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${active ? opt.color : 'var(--border)'}`,
                      background: active ? opt.color + '12' : 'var(--bg-input)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <opt.Icon size={22} color={active ? opt.color : 'var(--text-muted)'} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? opt.color : 'var(--text-primary)' }}>{opt.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3, textAlign: 'center' }}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                type="email"
                placeholder="negocio@correo.com"
                value={form.email}
                onChange={e => f('email', e.target.value)}
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={e => f('password', e.target.value)}
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                type="password"
                placeholder="Repite tu contraseña"
                value={form.confirmPassword}
                onChange={e => f('confirmPassword', e.target.value)}
                style={{ paddingLeft: 42 }}
                required
              />
            </div>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, textAlign: 'center', background: '#fef2f2', padding: '10px 14px', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 14, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'} {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <button
          onClick={onBack}
          style={{ marginTop: 24, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} /> Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
