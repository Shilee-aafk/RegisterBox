import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Reportes() {
  const { obtenerReporteAsistencia, formatCurrency, currentUser, empleados } = useApp();
  const [tipo, setTipo] = useState('asistencia');
  const [periodo, setPeriodo] = useState('mensual'); // 'mensual' | 'semanal'
  const [semana, setSemana] = useState(1);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [empleadoId, setEmpleadoId] = useState('todos');
  const [metodoPago, setMetodoPago] = useState('todos');
  const [tipoVenta, setTipoVenta] = useState('todos');
  const [loading, setLoading] = useState(false);

  // Solo Administrador
  if (currentUser?.role !== 'Administrador') {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  const handleDownload = async () => {
    setLoading(true);
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      let startDay = 1;
      let endDay = new Date(year, month, 0).getDate();
      
      if (periodo === 'semanal') {
        startDay = (semana - 1) * 7 + 1;
        endDay = semana === 4 ? new Date(year, month, 0).getDate() : semana * 7;
      }
      
      const startStr = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

      if (tipo === 'asistencia') {
        let data = await obtenerReporteAsistencia(year, month);
        
        // Filtrar por empleado si se seleccionó uno
        if (empleadoId !== 'todos') {
          data = data.filter(r => String(r.empleado_id) === String(empleadoId));
        }
        
        // Filtrar por periodo si es semanal
        if (periodo === 'semanal') {
          data = data.filter(r => {
            const d = parseInt(r.fecha.split('-')[2]);
            return d >= startDay && d <= endDay;
          });
        }

        csvContent += "Fecha,Empleado,Rol,Entrada,Salida,Horas Trabajadas\n";
        
        data.forEach(r => {
          let hours = 0;
          if (r.hora_entrada && r.hora_salida) {
            const [h1,m1] = r.hora_entrada.split(':');
            const [h2,m2] = r.hora_salida.split(':');
            hours = ((h2*60 + +m2) - (h1*60 + +m1)) / 60;
          }
          const row = [
            r.fecha,
            `"${r.empleados?.name || ''}"`,
            `"${r.empleados?.role || ''}"`,
            r.hora_entrada || '-',
            r.hora_salida || '-',
            hours > 0 ? hours.toFixed(2) : '0'
          ];
          csvContent += row.join(",") + "\n";
        });
        
        if (data.length === 0) {
          alert('No hay registros de asistencia con estos filtros.');
          setLoading(false);
          return;
        }

      } else if (tipo === 'ventas') {
        let query = supabase
          .from('transacciones')
          .select('*')
          .gte('created_at', startStr + 'T00:00:00')
          .lte('created_at', endStr + 'T23:59:59')
          .order('created_at', { ascending: false });
          
        if (metodoPago !== 'todos') {
          query = query.eq('payment_method', metodoPago);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        let filteredData = data;
        if (tipoVenta !== 'todos') {
          filteredData = filteredData.filter(t => t.category === tipoVenta || (tipoVenta === 'Ventas' && t.category === 'Ventas'));
        }
        
        csvContent += "Fecha,Descripcion,Monto,Metodo,Categoria\n";
        filteredData.forEach(t => {
          const row = [
            t.created_at.split('T')[0],
            `"${t.description || ''}"`,
            t.amount,
            `"${t.payment_method || ''}"`,
            `"${t.category || ''}"`
          ];
          csvContent += row.join(",") + "\n";
        });

        if (filteredData.length === 0) {
          alert('No hay transacciones con estos filtros.');
          setLoading(false);
          return;
        }
      }

      // Descargar archivo
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = `reporte_${tipo}_${periodo}${periodo==='semanal'?`_s${semana}`:''}_${year}_${month}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e) {
      alert('Error al generar el reporte: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileSpreadsheet size={20} color="var(--accent-blue)" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Reportes Avanzados</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Filtra y exporta datos del sistema en formato CSV</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 30, border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', maxWidth: 500 }}>
        
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Tipo de Reporte</label>
          <select className="form-select" value={tipo} onChange={e => { setTipo(e.target.value); setEmpleadoId('todos'); }}>
            <option value="asistencia">Reporte de Asistencia</option>
            <option value="ventas">Reporte de Ventas (Transacciones)</option>
          </select>
        </div>

        {tipo === 'asistencia' && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Empleado</label>
            <select className="form-select" value={empleadoId} onChange={e => setEmpleadoId(e.target.value)}>
              <option value="todos">Todos los Empleados</option>
              {empleados?.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        )}

        {tipo === 'ventas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Tipo de Venta</label>
              <select className="form-select" value={tipoVenta} onChange={e => setTipoVenta(e.target.value)}>
                <option value="todos">Todas las ventas</option>
                <option value="Venta de Productos">Solo Productos</option>
                <option value="Venta de Servicios">Solo Servicios</option>
                <option value="Venta Mixta">Mixtas (Ambos)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <select className="form-select" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                <option value="todos">Cualquier Método</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Periodo</label>
            <select className="form-select" value={periodo} onChange={e => setPeriodo(e.target.value)}>
              <option value="mensual">Mensual Completo</option>
              <option value="semanal">Por Semana</option>
            </select>
          </div>

          {periodo === 'semanal' && (
            <div className="form-group">
              <label className="form-label">Semana</label>
              <select className="form-select" value={semana} onChange={e => setSemana(+e.target.value)}>
                <option value={1}>Semana 1 (1 al 7)</option>
                <option value={2}>Semana 2 (8 al 14)</option>
                <option value={3}>Semana 3 (15 al 21)</option>
                <option value={4}>Semana 4 (22 a fin de mes)</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 30 }}>
          <div className="form-group">
            <label className="form-label">Mes</label>
            <select className="form-select" value={month} onChange={e => setMonth(+e.target.value)}>
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Año</label>
            <select className="form-select" value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={handleDownload} 
          disabled={loading}
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
        >
          {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
          {loading ? 'Generando...' : 'Descargar Reporte (CSV)'}
        </button>
      </div>
    </div>
  );
}
