import { useState } from 'react';
import { Users, DollarSign, Shield, Search, Pencil, X, Mail, Phone, Calendar, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';


const ROLE_COLORS = {
  Administrador: { bg: '#ede9fe', color: '#7c3aed' },
  Gerente: { bg: '#dbeafe', color: '#1d4ed8' },
  Personal: { bg: '#fce7f3', color: '#be185d' },
  Cajero: { bg: '#d1fae5', color: '#065f46' },
};

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

function RoleBadge({ role }) {
  const style = ROLE_COLORS[role] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ background: style.bg, color: style.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
      {role}
    </span>
  );
}

const DAYS = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const ROLES = ['Administrador', 'Gerente', 'Personal', 'Cajero'];
const EMPTY_FORM = { name: '', role: 'Personal', email: '', phone: '', salary: 0, since: new Date().toISOString().slice(0, 10), pin: '' };

export default function Empleados() {
  const { empleados, addEmpleado, updateEmpleado, toggleEmpleadoActive, formatCurrency: fmt } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const totalNomina = empleados.reduce((s, e) => s + e.salary, 0);
  const roles = [...new Set(empleados.map(e => e.role))].length;

  const filtered = empleados.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() { 
    const initialTemp = 'TEMP-' + Math.floor(1000 + Math.random() * 9000).toString();
    setForm({ ...EMPTY_FORM, pin: initialTemp }); 
    setEditId(null); 
    setShowModal(true); 
  }
  function openEdit(emp, evt) {
    evt.stopPropagation();
    setForm({ name: emp.name, role: emp.role, email: emp.email, phone: emp.phone, salary: emp.salary, since: emp.since ? emp.since.slice(0, 10) : new Date().toISOString().slice(0, 10), pin: emp.pin || '' });
    setEditId(emp.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;

    const pinInUse = empleados.find(e => String(e.pin) === String(form.pin) && e.id !== editId && !form.pin.startsWith('TEMP-'));
    if (pinInUse) {
      alert(`⚠️ Problema de Seguridad:\nEl PIN definitivo ya está siendo usado por el empleado "${pinInUse.name}".\nPor favor asigne un PIN único.`);
      return;
    }

    setSaving(true);
    const schedule = { lun: '08:00 - 18:00', mar: '08:00 - 18:00', mie: '08:00 - 18:00', jue: '08:00 - 18:00', vie: '08:00 - 18:00', sab: 'Libre', dom: 'Libre' };
    try {
      if (editId) {
        const r = await updateEmpleado(editId, { ...form, salary: +form.salary });
        if (selected?.id === editId) setSelected(r);
      } else {
        await addEmpleado({ ...form, salary: +form.salary, ventas: 0, total_vendido: 0, schedule, active: true });
      }
      setShowModal(false);
    } catch (e) { alert('Error: ' + e.message); }
    setSaving(false);
  }

  async function handleToggleActive(emp) {
    try { await toggleEmpleadoActive(emp.id, !emp.active); }
    catch (e) { alert('Error: ' + e.message); }
  }

  const avatarIdx = (emp) => empleados.findIndex(e => e.id === emp.id) % AVATAR_COLORS.length;

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Empleados Activos</p>
            <p className="stat-card-value">{empleados.length}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#eff6ff' }}>
            <Users size={20} color="#3b82f6" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Nómina Mensual</p>
            <p className="stat-card-value" style={{ fontSize: 18 }}>{fmt(totalNomina)}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#ecfdf5' }}>
            <DollarSign size={20} color="#10b981" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Roles</p>
            <p className="stat-card-value">{roles}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#f5f3ff' }}>
            <Shield size={20} color="#8b5cf6" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Left: Employee list */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Equipo</h2>
            <button className="btn-primary" onClick={openNew} id="btn-agregar-empleado">
              + Agregar Empleado
            </button>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div className="search-input-wrap">
              <Search size={14} color="var(--text-muted)" />
              <input placeholder="Buscar empleados..." value={search} onChange={e => setSearch(e.target.value)} id="emp-search" />
            </div>
          </div>

          {filtered.map((emp, i) => (
            <div
              key={emp.id}
              onClick={() => setSelected(emp)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                borderBottom: '1px solid #f9fafb', cursor: 'pointer',
                background: selected?.id === emp.id ? '#eff6ff' : 'transparent',
                transition: 'background .15s',
                borderLeft: selected?.id === emp.id ? '3px solid var(--accent-blue)' : '3px solid transparent',
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {emp.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</span>
                  <RoleBadge role={emp.role} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>✉ {emp.email}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>☎ {emp.phone}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{fmt(emp.salary)}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>mensual</p>
              </div>
              <button className="action-btn edit" onClick={e => openEdit(emp, e)} title="Editar">
                <Pencil size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Right: Detail */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, height: 'fit-content' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Detalle del Empleado</p>

          {!selected ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: .25 }} />
              <p style={{ fontSize: 13 }}>Selecciona un empleado<br />para ver sus detalles</p>
            </div>
          ) : (
            <>
              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: AVATAR_COLORS[avatarIdx(selected)], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, margin: '0 auto 10px' }}>
                  {selected.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                </div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</p>
                <div style={{ marginTop: 4 }}><RoleBadge role={selected.role} /></div>
              </div>

              {/* Contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Mail size={13} /> {selected.email}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Phone size={13} /> {selected.phone}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Calendar size={13} /> Desde {selected.since}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Wallet size={13} /> {fmt(selected.salary)}/mes
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 700 }}>{selected.ventas}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ventas</p>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>{fmt(selected.total_vendido)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Vendido</p>
                </div>
              </div>

              {/* Schedule */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} /> Horario Semanal
                </p>
                {DAYS.map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: selected.schedule?.[key] === 'Libre' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: selected.schedule?.[key] === 'Libre' ? 400 : 500 }}>{selected.schedule?.[key] || 'No asignado'}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn-secondary" style={{ width: '100%', textAlign: 'center' }}
                onClick={() => selected && handleToggleActive(selected)}>
                {selected?.active === false ? 'Activar' : 'Desactivar'}
              </button>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={e => openEdit(selected, e)}>Editar</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editId ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input className="form-input" placeholder="Nombre del empleado" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus id="emp-modal-nombre" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Salario Mensual</label>
                  <input className="form-input" type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ color: form.pin.startsWith('TEMP-') ? 'var(--accent-orange)' : 'inherit' }}>
                    {form.pin.startsWith('TEMP-') ? 'PIN Temporal Creado' : 'PIN de Seguridad'}
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="form-input" 
                      type="text" 
                      readOnly 
                      value={form.pin.startsWith('TEMP-') ? form.pin.replace('TEMP-', '') : '••••'} 
                      style={{ background: '#f9fafb', fontWeight: 800, letterSpacing: form.pin.startsWith('TEMP-') ? 4 : 2, flex: 1, textAlign: 'center', color: form.pin.startsWith('TEMP-') ? 'var(--accent-orange)' : 'var(--text-muted)' }} 
                    />
                    {editId && !form.pin.startsWith('TEMP-') && (
                      <button 
                        type="button" 
                        onClick={() => {
                          if(window.confirm('¿Deseas resetear el PIN de este empleado? Deberás decirle el nuevo código temporal para que pueda ingresar.')) {
                            setForm(f => ({...f, pin: 'TEMP-' + Math.floor(1000 + Math.random() * 9000).toString()}));
                          }
                        }} 
                        className="btn-secondary" 
                        style={{ padding: '0 12px', fontSize: 12 }}
                      >
                        Resetear
                      </button>
                    )}
                  </div>
                  {form.pin.startsWith('TEMP-') && <p style={{ fontSize: 11, color: 'var(--accent-orange)', marginTop: 4, fontWeight: 500 }}>¡Pásale este código al empleado para que entre!</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Ingreso</label>
                  <input className="form-input" type="date" value={form.since} onChange={e => setForm(f => ({ ...f, since: e.target.value }))} id="emp-modal-since" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} id="emp-modal-guardar">{saving ? 'Guardando…' : editId ? 'Guardar' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
