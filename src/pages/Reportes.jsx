import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Download, Loader2, CalendarDays, Users, CreditCard, Tag, Filter, BarChart3, Settings2 } from 'lucide-react';
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
    <div className="page-content" style={{ animation: 'dropSlideDown 0.4s ease-out' }}>
      
      {/* Header Premium */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--bg-card-dark) 0%, var(--bg-sidebar) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '30px 40px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '32px',
        boxShadow: '0 10px 25px -5px rgba(31, 145, 145, 0.4)'
      }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: 20, 
          background: 'rgba(255,255,255,0.2)', 
          backdropFilter: 'blur(10px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <BarChart3 size={32} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>Centro de Reportes</h1>
          <p style={{ fontSize: 15, opacity: 0.9, fontWeight: 400 }}>Genera analíticas detalladas y exporta los datos operativos de tu negocio.</p>
        </div>
      </div>

      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '40px', 
        border: '1px solid var(--border)', 
        boxShadow: 'var(--shadow-md)',
        maxWidth: 800,
        margin: '0 auto'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <Settings2 size={20} color="var(--accent-blue)" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Configuración del Reporte</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
          
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              <Filter size={16} color="var(--text-muted)" /> Tipo de Reporte
            </label>
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
            <div className="form-group" style={{ gridColumn: '1 / -1', zIndex: 90 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
                <Users size={16} color="var(--text-muted)" /> Empleado
              </label>
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
            <>

              <div className="form-group" style={{ zIndex: 90 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
                  <CreditCard size={16} color="var(--text-muted)" /> Método de Pago
                </label>
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
            </>
          )}

          <div className="form-group" style={{ zIndex: 80 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              <CalendarDays size={16} color="var(--text-muted)" /> Periodo
            </label>
            <CustomSelect 
              value={periodo} 
              onChange={setPeriodo}
              options={[
                { value: 'mensual', label: 'Mensual Completo' },
                { value: 'semanal', label: 'Por Semana' }
              ]}
            />
          </div>

          {periodo === 'semanal' ? (
            <div className="form-group" style={{ zIndex: 80 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
                <CalendarDays size={16} color="var(--text-muted)" /> Semana
              </label>
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
          ) : (
            <div></div>
          )}

          <div className="form-group" style={{ zIndex: 70 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              <CalendarDays size={16} color="var(--text-muted)" /> Mes
            </label>
            <CustomSelect 
              value={month} 
              onChange={val => setMonth(+val)}
              options={['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => ({ value: i+1, label: m }))}
            />
          </div>

          <div className="form-group" style={{ zIndex: 70 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
              <CalendarDays size={16} color="var(--text-muted)" /> Año
            </label>
            <CustomSelect 
              value={year} 
              onChange={val => setYear(+val)}
              options={[2024, 2025, 2026, 2027].map(y => ({ value: y, label: String(y) }))}
            />
          </div>
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={handleDownload} 
            disabled={loading}
            className="btn-primary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '16px', 
              fontSize: 16,
              background: 'linear-gradient(135deg, var(--bg-sidebar) 0%, var(--bg-card-dark) 100%)',
              border: 'none',
              boxShadow: '0 8px 20px -6px rgba(31, 145, 145, 0.5)',
              transition: 'all 0.2s ease',
              transform: loading ? 'scale(0.98)' : 'scale(1)',
              opacity: loading ? 0.8 : 1
            }}
            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={20} />}
            <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{loading ? 'Generando Reporte...' : 'Descargar Reporte (CSV)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
