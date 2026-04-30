import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Plus, SlidersHorizontal,
  DollarSign, ShoppingCart, Zap, Users, X, Trash2, Download
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import ExcelJS from 'exceljs';
import { useApp } from '../context/AppContext';
import CustomSelect from '../components/CustomSelect';


const CAT_ICONS = {
  Ventas: { icon: DollarSign, bg: '#ecfdf5', color: '#10b981' },
  Inventario: { icon: ShoppingCart, bg: '#eff6ff', color: '#3b82f6' },
  Servicios: { icon: Zap, bg: '#fff7ed', color: '#f97316' },
  Nómina: { icon: Users, bg: '#fdf4ff', color: '#a855f7' },
};

const EMPTY_FORM = { desc: '', category: 'Ventas', amount: 0, type: 'ingreso' };

export default function Finanzas() {
  const { transacciones, addTransaccion, deleteTransaccion, formatCurrency: fmt, logAction } = useApp();
  const [filter, setFilter] = useState('Todas');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customCategory, setCustomCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({ 
    desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), 
    hasta: new Date().toISOString().slice(0, 10) 
  });

  const ingresos = transacciones.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
  const gastos = transacciones.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
  const balance = ingresos - gastos;

  const filtered = transacciones.filter(t =>
    filter === 'Todas' ||
    (filter === 'Ingresos' && t.type === 'ingreso') ||
    (filter === 'Gastos' && t.type === 'gasto') ||
    t.category === filter
  );

  const gastosPie = Object.entries(
    transacciones.filter(t => t.type === 'gasto').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {})
  ).map(([name, value], i) => ({
    name, value,
    color: ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'][i % 4]
  }));

  // Calculate flow of cash for the last 7 days
  const flowDataRow = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('es-CL', { weekday: 'short' });
    const fullDate = d.toISOString().slice(0, 10);
    
    // Sum ingresos/gastos for this day
    const dayIncome = transacciones.filter(t => t.type === 'ingreso' && t.created_at?.startsWith(fullDate)).reduce((s, t) => s + t.amount, 0);
    const dayExpense = transacciones.filter(t => t.type === 'gasto' && t.created_at?.startsWith(fullDate)).reduce((s, t) => s + t.amount, 0);

    return { day: dayStr, ingresos: dayIncome, gastos: dayExpense };
  });

  async function handleAdd() {
    if (!form.desc.trim()) return;
    
    let finalCategory = form.category;
    if (form.category === 'Otro') {
      if (!customCategory.trim()) return alert('Debes ingresar el motivo de la transacción.');
      finalCategory = customCategory.trim();
    }

    setSaving(true);
    try {
      await addTransaccion({ description: form.desc, category: finalCategory, amount: +form.amount, type: form.type });
      await logAction('Nueva Transacción', `Registró ${form.type} de ${fmt(+form.amount)} en ${finalCategory}`, 'Finanzas');
      setShowModal(false);
      setForm(EMPTY_FORM);
      setCustomCategory('');
    } catch (e) { alert('Error: ' + e.message); }
    setSaving(false);
  }

  async function deleteT(id) {
    if (!confirm('¿Eliminar esta transacción?')) return;
    try { 
      await deleteTransaccion(id); 
      await logAction('Eliminar Transacción', `Eliminó una transacción financiera`, 'Finanzas');
    } catch (e) { alert('Error: ' + e.message); }
  }

  async function handleDownloadExcel() {
    const fromStr = exportDateRange.desde;
    // Agregamos un día al "hasta" internamente para que incluya todo el día seleccionado
    const toDate = new Date(exportDateRange.hasta);
    toDate.setDate(toDate.getDate() + 1);
    const toStr = toDate.toISOString().slice(0, 10);

    const filteredToExport = transacciones.filter(t => {
      const d = new Date(t.created_at).toISOString().slice(0, 10);
      return d >= fromStr && d < toStr;
    });

    if (filteredToExport.length === 0) {
      alert('No hay transacciones en ese rango de fechas para exportar');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transacciones');

    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Hora', key: 'hora', width: 10 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Descripción', key: 'descripcion', width: 35 },
      { header: 'Monto', key: 'monto', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F9191' } };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    filteredToExport.forEach(t => {
      const d = new Date(t.created_at);
      const row = sheet.addRow({
        fecha: d.toLocaleDateString('es-CL'),
        hora: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        tipo: t.type === 'ingreso' ? 'Ingreso' : 'Gasto',
        categoria: t.category,
        descripcion: t.description,
        monto: t.amount,
      });

      // Formato y color para la celda monto
      const color = t.type === 'ingreso' ? 'FF10B981' : 'FFEF4444'; 
      const montoCell = row.getCell('monto');
      montoCell.font = { color: { argb: color }, bold: true };
      montoCell.numFmt = '"$"#,##0';
    });

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
        // Alineación vertical y padding
        cell.alignment = { vertical: 'middle', ...cell.alignment };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transacciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  }

  const uniqueCategories = Array.from(new Set(transacciones.map(t => t.category)))
    .filter(cat => !['Ventas', 'Inventario', 'Servicios', 'Nómina', 'Otro'].includes(cat));

  const filterOptions = [
    { value: 'Todas', label: 'Todas' },
    { value: 'Ingresos', label: 'Ingresos' },
    { value: 'Gastos', label: 'Gastos' },
    { value: 'Ventas', label: 'Ventas' },
    { value: 'Inventario', label: 'Inventario' },
    { value: 'Servicios', label: 'Servicios' },
    { value: 'Nómina', label: 'Nómina' },
    ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
  ];

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Ingresos del Mes</p>
            <p className="stat-card-value" style={{ fontSize: 20, color: '#10b981' }}>{fmt(ingresos)}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#ecfdf5' }}>
            <TrendingUp size={20} color="#10b981" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Gastos del Mes</p>
            <p className="stat-card-value" style={{ fontSize: 20, color: '#ef4444' }}>{fmt(gastos)}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#fef2f2' }}>
            <TrendingDown size={20} color="#ef4444" />
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: balance >= 0 ? '#d1fae5' : '#fee2e2' }}>
          <div className="stat-card-left">
            <p className="stat-card-label">Balance del Mes</p>
            <p className="stat-card-value" style={{ fontSize: 20, color: balance >= 0 ? '#10b981' : '#ef4444' }}>{fmt(balance)}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#ecfdf5' }}>
            <Wallet size={20} color="#10b981" />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="charts-grid" style={{ marginBottom: 20 }}>
        {/* Line chart */}
        <div className="chart-card">
          <p className="chart-card-title">Flujo de Caja</p>
          <p className="chart-card-subtitle">Últimos 7 días</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={flowDataRow} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="chart-card">
          <p className="chart-card-title">Gastos por Categoría</p>
          <p className="chart-card-subtitle">Este mes</p>
          {gastosPie.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--text-muted)', fontSize: 13 }}>
              No hay gastos registrados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={gastosPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {gastosPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
                <Legend formatter={v => <span style={{ fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transactions table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Transacciones</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="filter-select" style={{ minWidth: 150 }}>
              <CustomSelect 
                value={filter} 
                onChange={val => setFilter(val)} 
                options={filterOptions} 
              />
            </div>
            <button className="btn-secondary" onClick={() => setShowExportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Exportar
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)} id="btn-agregar-transaccion">
              <Plus size={14} /> Agregar
            </button>
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 140px 40px', gap: 8, padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          <span>Fecha</span>
          <span>Descripción</span>
          <span>Categoría</span>
          <span style={{ textAlign: 'right' }}>Monto</span>
          <span></span>
        </div>

        {filtered.map(t => {
          const catInfo = CAT_ICONS[t.category] || CAT_ICONS['Ventas'];
          const Icon = catInfo.icon;
          return (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px 140px 40px', gap: 8, alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f9fafb', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{new Date(t.created_at).toLocaleDateString('es-CL')}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: catInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={catInfo.color} />
                </div>
                <span style={{ fontSize: 13 }}>{t.description}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{t.category}</span>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                {t.type === 'ingreso'
                  ? <TrendingUp size={13} color="#10b981" />
                  : <TrendingDown size={13} color="#ef4444" />}
                <span style={{ fontSize: 13, fontWeight: 700, color: t.type === 'ingreso' ? '#10b981' : '#ef4444' }}>
                  {fmt(t.amount)}
                </span>
              </div>
              <button className="action-btn delete" onClick={() => deleteT(t.id)} title="Eliminar">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Nueva Transacción</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input className="form-input" placeholder="Descripción de la transacción" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} autoFocus id="fin-modal-desc" />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ zIndex: 110 }}>
                  <label className="form-label">Tipo</label>
                  <CustomSelect 
                    value={form.type} 
                    onChange={val => setForm(f => ({ ...f, type: val }))}
                    options={[
                      { value: 'ingreso', label: 'Ingreso' },
                      { value: 'gasto', label: 'Gasto' }
                    ]}
                  />
                </div>
                <div className="form-group" style={{ zIndex: 100 }}>
                  <label className="form-label">Categoría / Motivo</label>
                  <CustomSelect 
                    value={form.category} 
                    onChange={val => setForm(f => ({ ...f, category: val }))}
                    options={[
                      { value: 'Ventas', label: 'Ventas' },
                      { value: 'Inventario', label: 'Inventario' },
                      { value: 'Servicios', label: 'Servicios' },
                      { value: 'Nómina', label: 'Nómina' },
                      { value: 'Otro', label: 'Otro' }
                    ]}
                  />
                </div>
              </div>
              
              {form.category === 'Otro' && (
                <div className="form-group" style={{ animation: 'dropSlideDown 0.2s ease-out' }}>
                  <label className="form-label">Ingresar Motivo</label>
                  <input 
                    className="form-input" 
                    placeholder="Ej: Pago de Luz, Alquiler..." 
                    value={customCategory} 
                    onChange={e => setCustomCategory(e.target.value)} 
                    autoFocus
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Monto</label>
                <input className="form-input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min={0} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving} id="fin-modal-agregar">{saving ? 'Guardando…' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExportModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Exportar Transacciones</h2>
              <button className="modal-close" onClick={() => setShowExportModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Selecciona el rango de fechas para descargar el reporte de ingresos y gastos.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Desde</label>
                  <input type="date" className="form-input" value={exportDateRange.desde} onChange={e => setExportDateRange(r => ({ ...r, desde: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hasta</label>
                  <input type="date" className="form-input" value={exportDateRange.hasta} onChange={e => setExportDateRange(r => ({ ...r, hasta: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowExportModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleDownloadExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={14} /> Descargar Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
