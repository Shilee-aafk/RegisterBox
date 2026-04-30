import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, Mail, Lock, ShieldCheck, KeyRound } from 'lucide-react';
import RegisterPage from './RegisterPage';

export default function LoginScreen() {
  const { config, processLogin, updateEmpleado, forceLogin, loginEmpresa, logoutEmpresa, empresaId } = useApp();
  
  // Si ya hay empresaId guardada, ir directo al PIN
  const [stage, setStage] = useState(empresaId ? 'pin' : 'empresa'); // 'empresa' | 'pin' | 'register'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [step, setStep] = useState(1); // 1=PIN, 2=NewPin, 3=ConfirmPin
  const [saving, setSaving] = useState(false);

  async function handleEmpresaLogin(e) {
    e.preventDefault();
    if (!email || !password || authLoading) return;
    setAuthLoading(true);
    setAuthError('');
    const result = await loginEmpresa(email, password);
    if (result.success) {
      setStage('pin');
    } else {
      setAuthError(result.error || 'Correo o contraseña incorrectos.');
    }
    setAuthLoading(false);
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (pin.length < 4 || saving) return;

    if (step === 1) {
      const res = processLogin(pin);
      if (!res.success) {
        setError('PIN incorrecto o inactivo.');
        setPin('');
      } else if (res.requireChange) {
        setPendingUser(res.employee);
        setStep(2);
        setPin('');
        setError('');
      }
      return;
    }

    if (step === 2) {
      setNewPin(pin);
      setStep(3);
      setPin('');
      setError('');
      return;
    }

    if (step === 3) {
      if (pin !== newPin) {
        setError('Los PIN no coinciden. Intenta de nuevo.');
        setStep(2);
        setNewPin('');
        setPin('');
        return;
      }
      try {
        setSaving(true);
        const updatedUser = await updateEmpleado(pendingUser.id, { pin: newPin });
        forceLogin({ ...pendingUser, ...updatedUser, active: true });
      } catch (err) {
        setError('Error al guardar. Intenta de nuevo.');
        setSaving(false);
      }
    }
  }

  function handlePadClick(num) {
    setError('');
    if (pin.length < 6) setPin(prev => prev + num);
  }

  function handleDelete() {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }

  if (stage === 'register') {
    return <RegisterPage onBack={() => setStage('empresa')} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--bg-app)', color: 'var(--text-primary)', overflow: 'hidden' }}>

      {/* Left Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-sidebar)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <div style={{ width: 140, height: 140, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={config.appearance.modoOscuroAuto ? "icon-negativo256.png" : "icon256.png"} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>{config?.biz?.nombre || 'GestorPro'}</h1>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 15, fontWeight: 500 }}>Sistema Inteligente de Gestión</p>
        {stage === 'pin' && (
          <div style={{ marginTop: 32, background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="rgba(255,255,255,.8)" />
            <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 13 }}>Empresa verificada ✓</span>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{ width: 480, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, boxShadow: '-5px 0 25px rgba(0,0,0,.05)', zIndex: 10 }}>

        {stage === 'empresa' ? (
          /* ===== STEP 1: Empresa Login ===== */
          <>
            <div style={{ width: 64, height: 64, background: 'var(--accent-blue-light)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <ShieldCheck size={30} color="var(--accent-blue)" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Acceso al Sistema</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center', maxWidth: 300, lineHeight: 1.4 }}>
              Ingresa con las credenciales de tu empresa para continuar.
            </p>

            <form onSubmit={handleEmpresaLogin} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    type="email"
                    placeholder="empresa@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ paddingLeft: 42 }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              {authError && (
                <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{authError}</p>
              )}

              <button type="submit" disabled={authLoading || !email || !password} className="btn-primary" style={{ padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 14, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {authLoading ? 'Verificando...' : 'Ingresar'} {!authLoading && <LogIn size={18} />}
              </button>
            </form>

            <div style={{ marginTop: 28, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>¿Primera vez aquí?</p>
              <button
                onClick={() => setStage('register')}
                style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                Registrar Nuevo Negocio
              </button>
            </div>
          </>
        ) : (
          /* ===== STEP 2: Employee PIN ===== */
          <>
            <div style={{ width: 64, height: 64, background: step === 1 ? 'var(--accent-blue-light)' : '#f0fdf4', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, transition: 'all 0.3s' }}>
              {step === 1 ? <KeyRound size={30} color="var(--accent-blue)" /> : <ShieldCheck size={30} color="#16a34a" />}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', textAlign: 'center' }}>
              {step === 1 ? '¿Quién eres?' : step === 2 ? 'Crea tu Nuevo PIN' : 'Confirma tu PIN'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center', maxWidth: 300, lineHeight: 1.4 }}>
              {step === 1 ? 'Ingresa tu PIN personal de empleado' : step === 2 ? `¡Hola ${pendingUser?.name?.split(' ')[0]}! Crea tu propia clave de 4 dígitos.` : 'Vuelve a digitar la clave para confirmar.'}
            </p>

            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ width: 50, height: 60, border: '2px solid', borderColor: pin.length > i ? (step === 1 ? 'var(--accent-blue)' : '#16a34a') : 'var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: pin.length > i ? (step === 1 ? 'var(--accent-blue-light)' : '#f0fdf4') : '#f9fafb', transition: 'all 0.2s' }}>
                    {pin.length > i && <div style={{ width: 12, height: 12, borderRadius: '50%', background: step === 1 ? 'var(--accent-blue)' : '#16a34a' }} />}
                  </div>
                ))}
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>{error}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, width: '100%' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button key={num} type="button" onClick={() => handlePadClick(num.toString())}
                    style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, background: '#f3f4f6', border: 'none', fontSize: 24, fontWeight: 600, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                  >{num}</button>
                ))}
                <div />
                <button type="button" onClick={() => handlePadClick('0')}
                  style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, background: '#f3f4f6', border: 'none', fontSize: 24, fontWeight: 600, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                >0</button>
                <button type="button" onClick={handleDelete}
                  style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >BORRAR</button>
              </div>

              <input type="password" pattern="[0-9]*" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }} autoFocus />

              <button type="submit" disabled={pin.length < 4 || saving} style={{ width: '100%', padding: '16px', borderRadius: 14, background: pin.length >= 4 ? (step === 1 ? 'var(--accent-blue)' : '#16a34a') : '#d1d5db', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: pin.length >= 4 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}>
                {saving ? 'Guardando...' : step === 1 ? 'Ingresar' : 'Continuar'} <LogIn size={18} />
              </button>
            </form>

            <button onClick={() => { logoutEmpresa(); setStage('empresa'); setStep(1); setPin(''); setError(''); }}
              style={{ marginTop: 24, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Cambiar de empresa
            </button>
          </>
        )}
      </div>
    </div>
  );
}
