import { useState, useEffect, useRef } from 'react';
import { Users, DollarSign, Shield, Search, Pencil, X, Mail, Phone, Calendar, Wallet, User, Trash2, CalendarDays, Loader2, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import './Empleados.css';


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
  const { empleados, addEmpleado, updateEmpleado, toggleEmpleadoActive, deleteEmpleado, formatCurrency: fmt, currentUser, obtenerReporteAsistencia, logAction, confirmAction } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  async function loadReport() {
    setReportLoading(true);
    try {
      const data = await obtenerReporteAsistencia(reportYear, reportMonth);
      setReportData(data);
    } catch (e) { alert(e.message); }
    setReportLoading(false);
  }
  useEffect(() => {
    if (showReport) loadReport();
  }, [showReport, reportMonth, reportYear]);

  // ====== Planificador por Horas — 3-Click Assignment ======
  const HOURS = [
    '07:00','08:00','09:00','10:00','11:00','12:00',
    '13:00','14:00','15:00','16:00','17:00','18:00',
    '19:00','20:00','21:00','22:00','23:00','00:00',
  ];
  const SLOT_H = 44;
  const hIdx = (h) => HOURS.indexOf(h);

  const empleadosDisponibles = empleados.map(e => ({ id: e.id, name: e.name, role: e.role }));

  const buildEmptyDays = () => {
    const d = {};
    DAYS.forEach(({ key }) => { d[key] = []; });
    return d;
  };

  const [horarioSemanal, setHorarioSemanal] = useState(buildEmptyDays);
  const [loadingHorarios, setLoadingHorarios] = useState(true);

  // 3-click state machine
  const [empSeleccionado, setEmpSeleccionado] = useState(null);
  const [seleccionTurno, setSeleccionTurno] = useState(null);

  // Hover & Tooltip
  const [hoveredEmpleadoId, setHoveredEmpleadoId] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { name, role, hora_inicio, hora_fin, x, y }
  const tooltipTimer = useRef(null);

  function handleShiftMouseEnter(e, shift) {
    clearTimeout(tooltipTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    tooltipTimer.current = setTimeout(() => {
      setTooltip({
        name: shift.name, role: shift.role,
        hora_inicio: shift.hora_inicio, hora_fin: shift.hora_fin,
        x: rect.left + rect.width / 2, y: rect.top - 4,
      });
    }, 2000);
  }
  function handleShiftMouseLeave() {
    clearTimeout(tooltipTimer.current);
    setTooltip(null);
  }

  // Track which day column is hovered (for per-day invisibility)
  const [hoveredDay, setHoveredDay] = useState(null);

  // --- Load from Supabase ---
  useEffect(() => {
    if (!empleados.length) return;

    const fetchHorarios = async (showLoading = true) => {
      if (showLoading) setLoadingHorarios(true);
      try {
        const { data, error } = await supabase.from('horarios_empleados').select('*');
        if (error) throw error;
        const mapped = buildEmptyDays();
        (data || []).forEach(row => {
          const day = row.dia_semana;
          if (!mapped[day]) return;
          const emp = empleados.find(e => e.id === row.empleado_id);
          mapped[day].push({
            horarioId: row.id,
            id: row.empleado_id,
            name: emp?.name || `#${row.empleado_id}`,
            role: emp?.role || 'Personal',
            hora_inicio: row.hora_inicio || '08:00',
            hora_fin: row.hora_fin || row.hora_inicio || '08:00',
          });
        });
        setHorarioSemanal(mapped);
      } catch (err) { console.error('Error cargando horarios:', err.message); }
      if (showLoading) setLoadingHorarios(false);
    };

    fetchHorarios();

    const channel = supabase
      .channel('horarios-empleados-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'horarios_empleados' }, () => {
        fetchHorarios(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empleados]);

  // --- Click 1: Select employee ---
  function handleSelectEmployee(emp) {
    if (empSeleccionado?.id === emp.id) {
      // Deselect
      setEmpSeleccionado(null);
      setSeleccionTurno(null);
    } else {
      setEmpSeleccionado(emp);
      setSeleccionTurno(null); // reset any pending start
    }
  }

  // --- Click 2 & 3: Grid clicks ---
  async function handleGridClick(dayKey, hour) {
    if (!empSeleccionado) return; // No employee selected

    if (!seleccionTurno) {
      // Click 2: set start hour
      setSeleccionTurno({ day: dayKey, startHour: hour });
      return;
    }

    // Click 3: must be same day and >= start
    if (seleccionTurno.day !== dayKey) {
      // Different day — reset start to this cell
      setSeleccionTurno({ day: dayKey, startHour: hour });
      return;
    }

    if (hIdx(hour) < hIdx(seleccionTurno.startHour)) {
      // Clicked above start — reset start
      setSeleccionTurno({ day: dayKey, startHour: hour });
      return;
    }

    // Valid end hour — insert!
    const hora_inicio = seleccionTurno.startHour;
    const hora_fin = hour;
    const emp = empSeleccionado;

    // Clear selection state immediately
    setSeleccionTurno(null);
    setEmpSeleccionado(null);
    setHoveredDay(null);

    try {
      // Local-first: queue for sync and update state optimistically
      const data = await db.horarios.insert(emp.id, dayKey, hora_inicio, hora_fin);
      setHorarioSemanal(prev => ({
        ...prev,
        [dayKey]: [...prev[dayKey], {
          horarioId: data.id, id: emp.id, name: emp.name, role: emp.role,
          hora_inicio, hora_fin,
        }],
      }));
      await logAction('Asignar Turno', `Asignó turno a ${emp.name} el ${DAYS.find(d=>d.key===dayKey)?.label} de ${hora_inicio} a ${hora_fin}`, 'Empleados');
    } catch (err) { console.error('Insert error:', err); }
  }

  function handleCancelSelection() {
    setEmpSeleccionado(null);
    setSeleccionTurno(null);
    setHoveredDay(null);
  }

  // --- Remove & Clear ---
  async function handleRemoveShift(dayKey, horarioId) {
    // Clear tooltip and hover immediately since the element is about to be removed
    clearTimeout(tooltipTimer.current);
    setTooltip(null);
    setHoveredEmpleadoId(null);

    const backup = horarioSemanal[dayKey];
    // Optimistic: remove from UI immediately
    setHorarioSemanal(prev => ({ ...prev, [dayKey]: prev[dayKey].filter(s => s.horarioId !== horarioId) }));
    try {
      // Local-first: queue delete for sync
      await db.horarios.delete(horarioId);
      const shift = backup.find(s => s.horarioId === horarioId);
      if (shift) {
        await logAction('Eliminar Turno', `Eliminó turno de ${shift.name} el ${DAYS.find(d=>d.key===dayKey)?.label}`, 'Empleados');
      }
    } catch (err) {
      console.error(err);
      setHorarioSemanal(prev => ({ ...prev, [dayKey]: backup }));
    }
  }

  async function handleClearPlanner() {
    const backup = { ...horarioSemanal };
    setHorarioSemanal(buildEmptyDays());
    try {
      // Queue individual deletes for each shift through the sync engine
      for (const dayKey of Object.keys(backup)) {
        for (const shift of backup[dayKey]) {
          await db.horarios.delete(shift.horarioId);
        }
      }
    } catch (err) { console.error(err); setHorarioSemanal(backup); }
  }

  // --- Layout: overlap collision (oldest → right 50%, newest → left 50%) ---
  function layoutShifts(shifts) {
    if (!shifts.length) return [];
    const items = shifts.map(s => ({ ...s, _col: 0, _total: 1 }));

    // For each shift, find all overlapping shifts
    items.forEach((s, i) => {
      const sStart = hIdx(s.hora_inicio), sEnd = hIdx(s.hora_fin);
      const overlaps = items.filter((o, j) => {
        if (j === i) return false;
        const oStart = hIdx(o.hora_inicio), oEnd = hIdx(o.hora_fin);
        return sStart <= oEnd && oStart <= sEnd; // ranges overlap
      });

      if (overlaps.length > 0) {
        // Total columns = all overlapping + self
        const group = [s, ...overlaps];
        const totalCols = group.length;
        // Sort group by array index (insertion order) — oldest first
        const sorted = group.sort((a, b) => items.indexOf(a) - items.indexOf(b));
        // Newest (last added) → col 0 (left), oldest → col 1+ (right)
        sorted.forEach((g, idx) => {
          // Reverse: newest = col 0, next-newest = col 1, etc
          g._col = totalCols - 1 - idx;
          g._total = totalCols;
        });
      }
    });

    return items;
  }

  const totalAsignaciones = Object.values(horarioSemanal).reduce((s, arr) => s + arr.length, 0);
  const dayShiftCount = (k) => horarioSemanal[k].length;
  const getEmpColor = (empId) => {
    const i = empleadosDisponibles.findIndex(e => e.id === empId);
    return AVATAR_COLORS[i >= 0 ? i % AVATAR_COLORS.length : 0];
  };

  // Gridline CSS class helper
  const gridlineClass = (dayKey, hour) => {
    const classes = ['planner-tl-gridline'];
    if (empSeleccionado) classes.push('selectable');
    if (seleccionTurno && seleccionTurno.day === dayKey) {
      if (hour === seleccionTurno.startHour) classes.push('start-selected');
      // Show range preview between start and hovered (we'll handle hover in-place)
    }
    return classes.join(' ');
  };

  // Current step number for the step bar
  const currentStep = !empSeleccionado ? 0 : !seleccionTurno ? 1 : 2;

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
        if (selected?.id === editId) setSelected({ ...selected, ...r });
        await logAction('Editar Empleado', `Modificó los datos de ${form.name}`, 'Empleados');
      } else {
        await addEmpleado({ ...form, salary: +form.salary, ventas: 0, total_vendido: 0, schedule, active: true });
        await logAction('Agregar Empleado', `Creó un nuevo empleado: ${form.name} (${form.role})`, 'Empleados');
      }
      setShowModal(false);
    } catch (e) { alert('Error: ' + e.message); }
    setSaving(false);
  }

  async function handleToggleActive(emp) {
    try { await toggleEmpleadoActive(emp.id, !emp.active); }
    catch (e) { alert('Error: ' + e.message); }
  }

  async function handleDeleteEmpleado(emp) {
    confirmAction(
      'Eliminar Empleado',
      `¿Estás seguro que deseas ELIMINAR al empleado "${emp.name}"? Esta acción es irreversible.`,
      async () => {
        try {
          await deleteEmpleado(emp.id);
          await logAction('Eliminar Empleado', `Borró al empleado ${emp.name} permanentemente`, 'Empleados');
          if (selected?.id === emp.id) setSelected(null);
        } catch (e) { alert('Error al eliminar empleado: ' + e.message); }
      }
    );
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
                {DAYS.map(({ key, label }) => {
                  const shifts = horarioSemanal[key]?.filter(s => String(s.id) === String(selected.id)) || [];
                  const timeText = shifts.length > 0 
                    ? shifts.map(s => `${s.hora_inicio} a ${s.hora_fin}`).join(', ')
                    : 'Libre';
                  
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, color: timeText === 'Libre' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: timeText === 'Libre' ? 400 : 600 }}>{timeText}</span>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn-secondary" style={{ width: '100%', textAlign: 'center' }}
                onClick={() => selected && handleToggleActive(selected)}>
                {selected?.active === false ? 'Activar' : 'Desactivar'}
              </button>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={e => openEdit(selected, e)}>Editar</button>
              </div>
              <button 
                onClick={() => selected && handleDeleteEmpleado(selected)}
                style={{ width: '100%', padding: '10px', marginTop: 8, background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
              >
                <Trash2 size={14} /> Eliminar Empleado
              </button>
            </>
          )}
        </div>
      </div>

      {/* ====== Planificador Semanal — 3 Clicks ====== */}
      <div className="planner-section">
        <div className="planner-section-header">
          <div className="planner-section-title">
            <div className="planner-icon">
              <CalendarDays size={16} />
            </div>
            Planificador Semanal
            {totalAsignaciones > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>
                — {totalAsignaciones} turno{totalAsignaciones !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {totalAsignaciones > 0 && (
            <button className="planner-clear-btn" onClick={handleClearPlanner} id="btn-clear-planner">
              <Trash2 size={12} /> Limpiar Todo
            </button>
          )}
        </div>

        {/* Step indicator */}
        {currentStep > 0 && (
          <div className="planner-step-bar">
            <div className="step-num">{currentStep}</div>
            {currentStep === 1 && (
              <span>
                <strong>{empSeleccionado.name}</strong> seleccionado — Haz click en la hora de <strong>inicio</strong>
              </span>
            )}
            {currentStep === 2 && (
              <span>
                Inicio en <strong>{seleccionTurno.startHour}</strong> ({DAYS.find(d => d.key === seleccionTurno.day)?.label}) — Haz click en la hora de <strong>fin</strong>
              </span>
            )}
            <button className="step-cancel" onClick={handleCancelSelection}>Cancelar</button>
          </div>
        )}

        <div className="planner-layout">
          {/* Left: Employee List */}
          <div className="planner-employees">
            <div className="planner-employees-header">
              <h3>Empleados</h3>
              <p>1. Selecciona un empleado</p>
            </div>
            <div className="planner-employees-list">
              {empleadosDisponibles.length === 0 ? (
                <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                  No hay empleados registrados.
                </div>
              ) : empleadosDisponibles.map((emp, idx) => (
                <div
                  key={emp.id}
                  className={`planner-emp-card${empSeleccionado?.id === emp.id ? ' selected' : ''}${hoveredEmpleadoId && hoveredEmpleadoId !== emp.id ? ' dimmed' : ''}${hoveredEmpleadoId === emp.id ? ' highlighted' : ''}`}
                  onClick={() => handleSelectEmployee(emp)}
                  onMouseEnter={() => setHoveredEmpleadoId(emp.id)}
                  onMouseLeave={() => setHoveredEmpleadoId(null)}
                  id={`select-emp-${emp.id}`}
                >
                  <div className="planner-emp-icon" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                    <User size={13} />
                  </div>
                  <div className="planner-emp-info">
                    <div className="planner-emp-name">{emp.name}</div>
                    <div className="planner-emp-role">{emp.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hourly Timeline */}
          <div className="planner-timeline-wrapper">
            {loadingHorarios ? (
              <div className="planner-loading-overlay">
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Cargando horarios...
              </div>
            ) : (
              <>
                <div className="planner-tl-header">
                  <div className="planner-tl-corner" />
                  {DAYS.map(({ key, label }) => (
                    <div key={key} className="planner-tl-day-header">
                      <div className="planner-tl-day-label">{label.slice(0, 3)}</div>
                      <div className="planner-tl-day-count">
                        {dayShiftCount(key) > 0 ? `${dayShiftCount(key)} turno${dayShiftCount(key) !== 1 ? 's' : ''}` : '—'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="planner-tl-body">
                  <div className="planner-tl-hours-col">
                    {HOURS.map(h => (
                      <div key={h} className="planner-tl-hour-label">{h}</div>
                    ))}
                  </div>

                  {DAYS.map(({ key }) => (
                    <div
                      key={key}
                      className={`planner-tl-day-col${empSeleccionado && hoveredDay === key ? ' assigning' : ''}`}
                      onMouseEnter={() => empSeleccionado && setHoveredDay(key)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {HOURS.map(h => (
                        <div
                          key={h}
                          className={gridlineClass(key, h)}
                          onClick={() => handleGridClick(key, h)}
                        />
                      ))}

                      {seleccionTurno?.day === key && (
                        <div className="planner-preview-block" style={{
                          top: hIdx(seleccionTurno.startHour) * SLOT_H,
                          height: SLOT_H - 2,
                          background: empSeleccionado ? `${getEmpColor(empSeleccionado.id)}18` : 'rgba(31,145,145,.1)',
                          borderColor: empSeleccionado ? getEmpColor(empSeleccionado.id) : 'var(--accent-blue)',
                        }}>
                          <span>{seleccionTurno.startHour} — ?</span>
                        </div>
                      )}

                      {layoutShifts(horarioSemanal[key]).map(shift => {
                        const spanH = hIdx(shift.hora_fin) - hIdx(shift.hora_inicio) + 1;
                        const color = getEmpColor(shift.id);
                        return (
                          <div
                            key={shift.horarioId}
                            className={`planner-shift-block${hoveredEmpleadoId === shift.id ? ' highlight' : ''}${hoveredEmpleadoId && hoveredEmpleadoId !== shift.id ? ' dim' : ''}`}
                            style={{
                              top: hIdx(shift.hora_inicio) * SLOT_H + 1,
                              height: spanH * SLOT_H - 2,
                              left: `calc(${(shift._col * 100) / shift._total}% + 1px)`,
                              width: `calc(${100 / shift._total}% - 2px)`,
                              background: hoveredEmpleadoId === shift.id ? `${color}30` : `${color}14`,
                              borderLeftColor: color,
                            }}
                            onMouseEnter={(e) => { setHoveredEmpleadoId(shift.id); handleShiftMouseEnter(e, shift); }}
                            onMouseLeave={() => { setHoveredEmpleadoId(null); handleShiftMouseLeave(); }}
                          >
                            <div className="shift-header">
                              <div className="shift-avatar" style={{ background: color }}>
                                {shift.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                              </div>
                              <span className="shift-name">{shift.name}</span>
                            </div>
                            {spanH > 1 && (
                              <span className="shift-time">{shift.hora_inicio} — {shift.hora_fin}</span>
                            )}
                            <button className="shift-remove" onClick={() => handleRemoveShift(key, shift.horarioId)} title="Quitar">
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>




      {/* Tooltip */}
      {tooltip && (
        <div className="shift-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="shift-tooltip-row">
            <User size={12} />
            <strong>{tooltip.name}</strong>
          </div>
          <div className="shift-tooltip-row">
            <Shield size={12} />
            <RoleBadge role={tooltip.role} />
          </div>
          <div className="shift-tooltip-row">
            <Calendar size={12} />
            <span>{tooltip.hora_inicio} — {tooltip.hora_fin}</span>
          </div>
        </div>
      )}

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

      {/* Report Modal */}
      {showReport && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReport(false)}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} /> Reporte de Asistencia</h2>
              <button className="modal-close" onClick={() => setShowReport(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <select className="form-select" value={reportMonth} onChange={e => setReportMonth(+e.target.value)}>
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select className="form-select" value={reportYear} onChange={e => setReportYear(+e.target.value)}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {reportLoading ? <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Cargando...</p> : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee', color: 'var(--text-muted)' }}>
                        <th style={{ padding: 10, fontWeight: 600 }}>Fecha</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Empleado</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Rol</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Entrada</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Salida</th>
                        <th style={{ padding: 10, fontWeight: 600 }}>Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map(r => {
                        let hours = 0;
                        if (r.hora_entrada && r.hora_salida) {
                          const [h1,m1] = r.hora_entrada.split(':');
                          const [h2,m2] = r.hora_salida.split(':');
                          hours = ((h2*60 + +m2) - (h1*60 + +m1)) / 60;
                        }
                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                            <td style={{ padding: 10 }}>{r.fecha.split('-').reverse().join('/')}</td>
                            <td style={{ padding: 10, fontWeight: 500 }}>{r.empleados?.name}</td>
                            <td style={{ padding: 10 }}><RoleBadge role={r.empleados?.role} /></td>
                            <td style={{ padding: 10 }}>{r.hora_entrada || '-'}</td>
                            <td style={{ padding: 10 }}>{r.hora_salida || '-'}</td>
                            <td style={{ padding: 10, fontWeight: 600, color: hours > 0 ? 'var(--accent-blue)' : 'inherit' }}>{hours > 0 ? hours.toFixed(2) : '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {reportData.length === 0 && <p style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No hay registros de asistencia en este mes.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
