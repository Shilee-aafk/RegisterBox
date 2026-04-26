import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, User, KeyRound, CheckCircle, ArrowRight } from 'lucide-react';

export default function FirstTimeSetup() {
  const { createInitialAdmin, config } = useApp();
  const [step, setStep] = useState(1); // 1=nombre, 2=pin, 3=confirmPin
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handlePad(num, target) {
    setError('');
    if (target === 'pin' && pin.length < 4) setPin(p => p + num);
    if (target === 'confirm' && confirmPin.length < 4) setConfirmPin(p => p + num);
  }

  function handleDelete(target) {
    setError('');
    if (target === 'pin') setPin(p => p.slice(0, -1));
    if (target === 'confirm') setConfirmPin(p => p.slice(0, -1));
  }

  async function handleFinish() {
    if (pin !== confirmPin) {
      setError('Los PINs no coinciden. Inténtalo de nuevo.');
      setConfirmPin('');
      setStep(2);
      return;
    }
    setSaving(true);
    try {
      await createInitialAdmin({ name: name.trim(), pin });
    } catch (e) {
      setError('Error al crear el administrador: ' + e.message);
      setSaving(false);
    }
  }

  const activePin = step === 2 ? pin : confirmPin;
  const activePad = step === 2 ? 'pin' : 'confirm';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--bg-app)', color: 'var(--text-primary)', overflow: 'hidden' }}>

      {/* Left branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-sidebar)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <img src={config.appearance.modoOscuroAuto ? "icon-negativo256.png" : "icon256.png"} alt="Logo" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 16 }} />
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{config?.biz?.nombre || 'GestorPro'}</h1>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 15 }}>Configuración Inicial</p>

        {/* Progress steps */}
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { n: 1, label: 'Tu nombre' },
            { n: 2, label: 'Crear PIN' },
            { n: 3, label: 'Confirmar PIN' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step > s.n ? '#10b981' : step === s.n ? '#fff' : 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                {step > s.n
                  ? <CheckCircle size={18} color="#fff" />
                  : <span style={{ fontSize: 13, fontWeight: 700, color: step === s.n ? 'var(--accent-blue)' : 'rgba(255,255,255,.5)' }}>{s.n}</span>
                }
              </div>
              <span style={{ color: step >= s.n ? '#fff' : 'rgba(255,255,255,.4)', fontWeight: step === s.n ? 700 : 400, fontSize: 14 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: 480, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, boxShadow: '-5px 0 25px rgba(0,0,0,.05)' }}>

        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--accent-blue-light), #f0fdf4)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {step === 1 ? <Sparkles size={28} color="var(--accent-blue)" /> : <KeyRound size={28} color="var(--accent-blue)" />}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
          {step === 1 ? '¡Bienvenido a bordo!' : step === 2 ? 'Crea tu PIN de acceso' : 'Confirma tu PIN'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
          {step === 1
            ? 'Esta es la primera vez que ingresas. Vamos a crear tu cuenta de Administrador.'
            : step === 2
            ? 'Elige un PIN de 4 dígitos para entrar al sistema con tu cuenta.'
            : 'Repite el PIN para confirmar que lo recuerdas correctamente.'}
        </p>

        {/* STEP 1: Name */}
        {step === 1 && (
          <div style={{ width: '100%', maxWidth: 320 }}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Tu nombre completo</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  placeholder="Ej: María González"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: 42 }}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && name.trim().length >= 2 && setStep(2)}
                />
              </div>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
            <button
              className="btn-primary"
              disabled={name.trim().length < 2}
              onClick={() => setStep(2)}
              style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Continuar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2 & 3: PIN pad */}
        {(step === 2 || step === 3) && (
          <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* PIN dots */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 50, height: 60, border: '2px solid',
                  borderColor: activePin.length > i ? 'var(--accent-blue)' : 'var(--border)',
                  borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: activePin.length > i ? 'var(--accent-blue-light)' : '#f9fafb',
                  transition: 'all 0.2s'
                }}>
                  {activePin.length > i && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-blue)' }} />}
                </div>
              ))}
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}

            {/* Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, width: '100%' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} type="button" onClick={() => handlePad(num.toString(), activePad)}
                  style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, background: '#f3f4f6', border: 'none', fontSize: 24, fontWeight: 600, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
                >{num}</button>
              ))}
              <div />
              <button type="button" onClick={() => handlePad('0', activePad)}
                style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, background: '#f3f4f6', border: 'none', fontSize: 24, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
              >0</button>
              <button type="button" onClick={() => handleDelete(activePad)}
                style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
              >BORRAR</button>
            </div>

            {step === 2 ? (
              <button
                disabled={pin.length < 4}
                onClick={() => setStep(3)}
                style={{ width: '100%', padding: '16px', borderRadius: 14, background: pin.length >= 4 ? 'var(--accent-blue)' : '#d1d5db', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: pin.length >= 4 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Continuar <ArrowRight size={18} />
              </button>
            ) : (
              <button
                disabled={confirmPin.length < 4 || saving}
                onClick={handleFinish}
                style={{ width: '100%', padding: '16px', borderRadius: 14, background: confirmPin.length >= 4 ? '#10b981' : '#d1d5db', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: confirmPin.length >= 4 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {saving ? 'Creando cuenta...' : '¡Listo, ingresar!'} {!saving && <CheckCircle size={18} />}
              </button>
            )}

            {step === 3 && (
              <button onClick={() => { setStep(2); setConfirmPin(''); setError(''); }}
                style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Cambiar el PIN
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
