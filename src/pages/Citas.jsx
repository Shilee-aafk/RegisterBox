import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Plus, ChevronLeft, ChevronRight, X, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';


function pad(n) { return String(n).padStart(2, '0'); }

function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DAYS_ES = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];

const STATUS_COLORS = {
  pendiente: { bg: '#fef3c7', color: '#92400e' },
  completada: { bg: '#d1fae5', color: '#065f46' },
  cancelada: { bg: '#fee2e2', color: '#991b1b' },
};

const EMPTY_FORM = { service: '', client_name: '', date: isoDate(new Date()), time: '09:00', duration: 30, price: 0, empleado_name: '' };

export default function Citas() {
  const { citas, addCita, updateCita, deleteCita, productos, clientes, addCliente, empleados, formatCurrency: fmt, confirmAction } = useApp();
  const [today] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const m = new Date(d);
    m.setDate(d.getDate() + diff);
    return m;
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', phone: '', email: '' });
  const [clientSaving, setClientSaving] = useState(false);

  function openNewCita() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowNewClientForm(false);
    setShowModal(true);
  }

  function openEditCita(c) {
    setForm({
      service: c.service, client_name: c.client_name, date: c.date,
      time: c.time, duration: c.duration, price: c.price, empleado_name: c.empleado_name
    });
    setEditId(c.id);
    setSelectedDate(new Date(c.date + 'T12:00:00'));
    setShowModal(true);
  }

  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam && citas.length > 0) {
      const c = citas.find(x => String(x.id) === String(editParam));
      if (c) {
        openEditCita(c);
      }
      setSearchParams(new URLSearchParams(), { replace: true });
    }
  }, [searchParams, citas, setSearchParams]);

  const services = [...new Set(productos.map(p => p.name))];
  const clientNames = clientes.map(c => c.name);
  const employeeNames = empleados.map(e => e.name);

  const todayStr = isoDate(today);
  const selectedStr = isoDate(selectedDate);

  // Build week days from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }

  const citasToday = citas.filter(c => c.date === todayStr);
  const citasSelected = citas.filter(c => c.date === selectedStr);
  const proximasCitas = [...citas].sort((a, b) => a.date + a.time > b.date + b.time ? 1 : -1).filter(c => c.status === 'pendiente');
  const completadas = citas.filter(c => c.date === todayStr && c.status === 'completada').length;

  async function handleAddCita() {
    if (!form.service || !form.client_name || !form.empleado_name) {
      alert('Por favor selecciona un servicio, cliente y empleado.');
      return;
    }
    setSaving(true);
    try {
      const payload = { service: form.service, client_name: form.client_name, date: form.date, time: form.time, duration: +form.duration, price: +form.price, empleado_name: form.empleado_name, status: 'pendiente' };
      if (editId) {
        await updateCita(editId, payload);
      } else {
        await addCita(payload);
      }
      setShowModal(false);
    } catch (e) { alert('Error: ' + e.message); }
    setSaving(false);
  }

  async function handleCreateClient() {
    if (!newClientData.name.trim()) return alert('Debe indicar al menos el nombre del cliente.');
    setClientSaving(true);
    try {
      await addCliente({ 
        name: newClientData.name.trim(), 
        email: newClientData.email.trim() || null, 
        phone: newClientData.phone.trim() || null, 
        total_compras: 0, num_compras: 0, puntos: 0 
      });
      setForm(f => ({ ...f, client_name: newClientData.name.trim() }));
      setShowNewClientForm(false);
      setNewClientData({ name: '', phone: '', email: '' });
    } catch (e) { alert('Error creando cliente: ' + e.message); }
    setClientSaving(false);
  }

  async function toggleStatus(id) {
    const cita = citas.find(c => c.id === id);
    if (!cita) return;
    try { await updateCita(id, { status: cita.status === 'pendiente' ? 'completada' : 'pendiente' }); }
    catch(e) { alert('Error: ' + e.message); }
  }

  async function deleteCitaFn(id) {
    confirmAction(
      'Cancelar Cita',
      '¿Estás seguro que deseas eliminar o cancelar esta cita permanentemente?',
      async () => {
        try { await deleteCita(id); }
        catch(e) { alert('Error: ' + e.message); }
      }
    );
  }

  // Count appointments per day for dot display
  function dayCount(d) { return citas.filter(c => c.date === isoDate(d)).length; }

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Citas de Hoy</p>
            <p className="stat-card-value">{citasToday.length}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#eff6ff' }}>
            <Calendar size={20} color="#3b82f6" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Próximas Citas</p>
            <p className="stat-card-value">{proximasCitas.length}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#ecfdf5' }}>
            <Clock size={20} color="#10b981" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Completadas Hoy</p>
            <p className="stat-card-value">{completadas}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#f0fdf4' }}>
            <CheckCircle size={20} color="#22c55e" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        {/* Calendar panel */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          {/* Calendar header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Calendario</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, background: 'var(--bg-card)', cursor: 'pointer' }}
                onClick={() => { setSelectedDate(new Date()); }}
              >
                Hoy
              </button>
              <button className="btn-primary" onClick={openNewCita} id="btn-nueva-cita">
                <Plus size={14} /> Nueva Cita
              </button>
            </div>
          </div>

          {/* Week navigation */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={prevWeek} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-card)' }}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {MONTHS_ES[weekStart.getMonth()]} {weekStart.getFullYear()}
              </span>
              <button onClick={nextWeek} style={{ width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-card)' }}>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Week days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 20 }}>
              {weekDays.map((d, i) => {
                const ds = isoDate(d);
                const isSelected = ds === selectedStr;
                const isToday = ds === todayStr;
                const count = dayCount(d);
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(new Date(d))}
                    style={{
                      textAlign: 'center', cursor: 'pointer', padding: '10px 4px', borderRadius: 10,
                      background: isSelected ? 'var(--accent-blue)' : isToday ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#fff' : isToday ? 'var(--accent-blue)' : 'var(--text-primary)',
                      border: isToday && !isSelected ? '2px solid var(--accent-blue)' : '2px solid transparent',
                      transition: 'all .15s',
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: isSelected ? .8 : 1 }}>{DAYS_ES[d.getDay()]}</p>
                    <p style={{ fontSize: 16, fontWeight: 700 }}>{d.getDate()}</p>
                    {count > 0 && (
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                          <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : 'var(--accent-blue)' }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day appointments */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 12 }}>
                Citas para {selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              {citasSelected.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
                  No hay citas programadas para este día
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {citasSelected.map(cita => {
                    const sc = STATUS_COLORS[cita.status];
                    return (
                      <div key={cita.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f9fafb', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ width: 4, borderRadius: 99, alignSelf: 'stretch', background: cita.status === 'completada' ? '#10b981' : 'var(--accent-blue)' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600 }}>{cita.service}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cita.client_name} · {cita.empleado_name}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{cita.time}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cita.duration} min</p>
                        </div>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                          {cita.status}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="action-btn edit" title="Editar cita" onClick={() => openEditCita(cita)}>
                            <Pencil size={14} />
                          </button>
                          <button className="action-btn edit" title="Marcar completada" onClick={() => toggleStatus(cita.id)}>
                            <CheckCircle size={14} />
                          </button>
                          <button className="action-btn delete" title="Eliminar" onClick={() => deleteCitaFn(cita.id)}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Upcoming appointments */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, height: 'fit-content' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Próximas Citas</p>
          <p style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500, marginBottom: 14 }}>Agenda de los próximos días</p>

          {proximasCitas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
              No hay citas próximas
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proximasCitas.map(cita => (
                <div
                  key={cita.id}
                  style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 10, cursor: 'pointer', transition: 'background .15s' }}
                  onClick={() => setSelectedDate(new Date(cita.date + 'T12:00:00'))}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cita.service}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)' }}>{fmt(cita.price)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cita.client_name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(cita.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} {cita.time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Cita */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editId ? 'Editar Cita' : 'Nueva Cita'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Servicio</label>
                <select className="form-select" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
                  <option value="">-- Seleccionar Servicio --</option>
                  {productos.map(p => <option key={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Cliente</label>
                  {!showNewClientForm && (
                    <button type="button" onClick={() => setShowNewClientForm(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Plus size={12} /> Nuevo
                    </button>
                  )}
                </div>
                {showNewClientForm ? (
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Crear Cliente Rápido</p>
                    <input className="form-input" placeholder="Nombre completo" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" placeholder="Teléfono" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} style={{ flex: 1 }} />
                      <input className="form-input" placeholder="Email (opcional)" type="email" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} style={{ flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button type="button" className="btn-primary" style={{ flex: 1, padding: '8px' }} onClick={handleCreateClient} disabled={clientSaving}>
                        {clientSaving ? 'Guardando...' : 'Crear y Seleccionar'}
                      </button>
                      <button type="button" className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setShowNewClientForm(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <select className="form-select" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}>
                    <option value="">-- Seleccionar Cliente --</option>
                    {clientNames.map(c => <option key={c}>{c}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Empleado</label>
                <select className="form-select" value={form.empleado_name} onChange={e => setForm(f => ({ ...f, empleado_name: e.target.value }))}>
                  <option value="">-- Seleccionar Empleado --</option>
                  {employeeNames.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input className="form-input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duración (min)</label>
                  <input className="form-input" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} min={15} step={15} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddCita} disabled={saving} id="cita-modal-agregar">{saving ? 'Guardando…' : (editId ? 'Guardar' : 'Agendar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
