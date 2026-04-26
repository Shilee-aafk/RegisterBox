import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CustomSelect from '../components/CustomSelect';

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
          <CustomSelect 
            value={tipo} 
            onChange={val => { setTipo(val); setEmpleadoId('todos'); }}
            options={[
              { value: 'asistencia', label: 'Reporte de Asistencia' },
              { value: 'ventas', label: 'Reporte de Ventas (Transacciones)' }
            ]}
          />
        </div>

        {tipo === 'asistencia' && (
          <div className="form-group" style={{ marginBottom: 16, zIndex: 90 }}>
            <label className="form-label">Empleado</label>
            <CustomSelect 
              value={empleadoId} 
              onChange={setEmpleadoId}
              options={[
                { value: 'todos', label: 'Todos los Empleados' },
                ...(empleados?.map(emp => ({ value: emp.id, label: emp.name })) || [])
              ]}
            />
          </div>
        )}

        {tipo === 'ventas' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, zIndex: 90 }}>
            <div className="form-group">
              <label className="form-label">Tipo de Venta</label>
              <CustomSelect 
                value={tipoVenta} 
                onChange={setTipoVenta}
                options={[
                  { value: 'todos', label: 'Todas las ventas' },
                  { value: 'Venta de Productos', label: 'Solo Productos' },
                  { value: 'Venta de Servicios', label: 'Solo Servicios' },
                  { value: 'Venta Mixta', label: 'Mixtas (Ambos)' }
                ]}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <CustomSelect 
                value={metodoPago} 
                onChange={setMetodoPago}
                options={[
                  { value: 'todos', label: 'Cualquier Método' },
                  { value: 'efectivo', label: 'Efectivo' },
                  { value: 'tarjeta', label: 'Tarjeta' },
                  { value: 'transferencia', label: 'Transferencia' }
                ]}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, zIndex: 80 }}>
          <div className="form-group">
            <label className="form-label">Periodo</label>
            <CustomSelect 
              value={periodo} 
              onChange={setPeriodo}
              options={[
                { value: 'mensual', label: 'Mensual Completo' },
                { value: 'semanal', label: 'Por Semana' }
              ]}
            />
          </div>

          {periodo === 'semanal' && (
            <div className="form-group">
              <label className="form-label">Semana</label>
              <CustomSelect 
                value={semana} 
                onChange={val => setSemana(+val)}
                options={[
                  { value: 1, label: 'Semana 1 (1 al 7)' },
                  { value: 2, label: 'Semana 2 (8 al 14)' },
                  { value: 3, label: 'Semana 3 (15 al 21)' },
                  { value: 4, label: 'Semana 4 (22 a fin de mes)' }
                ]}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 30, zIndex: 70 }}>
          <div className="form-group">
            <label className="form-label">Mes</label>
            <CustomSelect 
              value={month} 
              onChange={val => setMonth(+val)}
              options={['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => ({ value: i+1, label: m }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Año</label>
            <CustomSelect 
              value={year} 
              onChange={val => setYear(+val)}
              options={[2024, 2025, 2026, 2027].map(y => ({ value: y, label: String(y) }))}
            />
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
