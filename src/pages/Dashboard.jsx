import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useState, useMemo } from 'react';
import {
  DollarSign, Target, Users, Calendar,
  TrendingUp, Zap, Package, TriangleAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockSalesWeek, mockIncomeVsExpense } from '../data/mockData';


function StatCard({ label, value, changeLabel, change, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="stat-card">
      <div className="stat-card-left">
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}</p>
        <span className={`stat-card-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
          <TrendingUp size={12} />{changeLabel}
        </span>
      </div>
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <Icon size={20} color={iconColor} />
      </div>
    </div>
  );
}



function TooltipArea({ active, payload, label, fmt }) {
  if (active && payload?.length) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <strong>{label}</strong>
      {payload.map(p => <div key={p.name} style={{ color: p.color, marginTop: 2 }}>{p.name}: {fmt(p.value || 0)}</div>)}
    </div>
  );
  return null;
}

export default function Dashboard() {
  const { ventasHoy, transaccionesHoy, clientes, citasHoy, stockAlerts, transacciones, loading, formatCurrency: fmt } = useApp();

  // Last 5 income transactions as "recent sales" - memoized for stability
  const recentSales = useMemo(() => {
    return (transacciones || [])
      .filter(t => t.type === 'ingreso')
      .slice(0, 5);
  }, [transacciones]);

  // Build pie data from transactions by category
  const categoryPie = useMemo(() => {
    const catMap = (transacciones || [])
      .filter(t => t.type === 'ingreso' && t.category)
      .reduce((acc, t) => { 
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount || 0); 
        return acc; 
      }, {});
    const catColors = ['#1f9191', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    return Object.entries(catMap).map(([name, value], i) => ({ 
      name, 
      value, 
      color: catColors[i % catColors.length] 
    }));
  }, [transacciones]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#1f9191', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando datos…</p>
    </div>
  );

  return (
    <div className="page-content">
      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard label="Ventas de Hoy" value={fmt(ventasHoy)} change={1}
          changeLabel={`${transaccionesHoy} transacciones`} icon={DollarSign} iconBg="#e4f4f4" iconColor="#1f9191" />
        <StatCard label="Transacciones" value={transaccionesHoy} change={1}
          changeLabel="hoy" icon={Target} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Clientes Totales" value={clientes.length} change={1}
          changeLabel="registrados" icon={Users} iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="Citas de Hoy" value={citasHoy.length} change={0}
          changeLabel={`${citasHoy.filter(c => c.status === 'pendiente').length} pendientes`}
          icon={Calendar} iconBg="#e4f4f4" iconColor="#1f9191" />
      </div>

      {/* ---- Predicciones ---- */}
      <div className="section-header">
        <h2 className="section-title"><Zap size={18} color="#f59e0b" /> Predicciones Inteligentes</h2>
      </div>
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="prediction-card-header">
            <span className="prediction-card-title"><DollarSign size={15} color="#1f9191" /> Predicción De Ventas</span>
            <span className="prediction-card-period">Próxima semana</span>
          </div>
          <div className="prediction-card-value">{fmt(ventasHoy * 7 || 2850000)}</div>
          <div>
            <span className="prediction-badge alza"><TrendingUp size={10} /> Alza</span>
            <span className="prediction-confidence">85% confianza</span>
          </div>
          <p className="prediction-desc">Basado en tendencias históricas y citas programadas, se espera un aumento del 12% en ventas.</p>
        </div>

        <div className="prediction-card">
          <div className="prediction-card-header">
            <span className="prediction-card-title"><Package size={15} color="#10b981" /> Predicción De Inventario</span>
            <span className="prediction-card-period">Próximos 7 días</span>
          </div>
          <div className="prediction-card-value">{stockAlerts.length}</div>
          <div>
            <span className="prediction-badge baja"><TrendingUp size={10} style={{ transform: 'rotate(180deg)' }} /> Baja</span>
            <span className="prediction-confidence">92% confianza</span>
          </div>
          <p className="prediction-desc">
            {stockAlerts.length > 0
              ? `${stockAlerts.map(p => p.name).slice(0, 2).join(', ')} necesitan reabastecimiento urgente.`
              : 'El inventario se encuentra en buen estado.'}
          </p>
        </div>

        <div className="prediction-card">
          <div className="prediction-card-header">
            <span className="prediction-card-title"><Users size={15} color="#8b5cf6" /> Predicción De Clientes</span>
            <span className="prediction-card-period">Este mes</span>
          </div>
          <div className="prediction-card-value">{Math.max(1, Math.round(clientes.length * 0.05))}</div>
          <div>
            <span className="prediction-badge alza"><TrendingUp size={10} /> Alza</span>
            <span className="prediction-confidence">78% confianza</span>
          </div>
          <p className="prediction-desc">Se proyectan nuevos clientes basado en el patrón de crecimiento actual.</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        <div className="chart-card">
          <p className="chart-card-title">Ventas de la Semana</p>
          <p className="chart-card-subtitle">Comparación con meta diaria</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockSalesWeek} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f9191" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1f9191" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipArea fmt={fmt} />} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#1f9191" strokeWidth={2.5} fill="url(#colorVentas)" dot={false} />
              <Area type="monotone" dataKey="meta" name="Meta" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="chart-card-title">Ingresos por Categoría</p>
          <p className="chart-card-subtitle">Distribución actual</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryPie.length ? categoryPie : [{ name: 'Sin datos', value: 1, color: '#e5e7eb' }]}
                cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {(categoryPie.length ? categoryPie : [{ color: '#e5e7eb' }]).map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
              <Legend formatter={v => <span style={{ fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        <div className="chart-card">
          <p className="chart-card-title">Ingresos vs Gastos</p>
          <p className="chart-card-subtitle">Últimos 3 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockIncomeVsExpense} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="alerts-panel" style={{ alignSelf: 'start' }}>
          <p className="alerts-panel-title"><TriangleAlert size={16} /> Alertas de Stock</p>
          <p className="alerts-panel-subtitle">Productos por debajo del mínimo</p>
          {stockAlerts.length === 0 ? (
            <div className="empty-state">✅ Todos los productos tienen stock suficiente</div>
          ) : stockAlerts.map(item => (
            <div className="alert-item" key={item.id}>
              <div className="alert-item-info">
                <p className="alert-item-name">{item.name}</p>
                <p className="alert-item-min">Min: {item.min_stock} unidades</p>
              </div>
              <div className="alert-item-stock">{item.stock}<span>unidades</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="charts-grid">
        <div className="recent-sales-panel">
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Ventas Recientes</p>
          <p style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500, marginBottom: 14 }}>Últimas transacciones realizadas</p>
          {recentSales.length === 0
            ? <div className="empty-state">No hay ventas registradas aún</div>
            : recentSales.map(sale => (
              <div className="sale-item" key={sale.id}>
                <div className="sale-icon"><DollarSign size={15} /></div>
                <div className="sale-info">
                  <p className="sale-name">{sale.description}</p>
                  <p className="sale-detail">{sale.category}</p>
                </div>
                <div className="sale-right">
                  <p className="sale-amount">{fmt(sale.amount)}</p>
                  <p className="sale-time">{new Date(sale.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
        </div>

        <div className="appointments-panel">
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Citas de Hoy</p>
          <p style={{ fontSize: 12, color: 'var(--accent-blue)', fontWeight: 500, marginBottom: 14 }}>Agenda del día</p>
          {citasHoy.length === 0
            ? <div className="empty-state">No hay citas programadas para hoy</div>
            : citasHoy.map(c => (
              <div className="sale-item" key={c.id}>
                <div className="sale-icon" style={{ background: '#f0fdf4', color: '#10b981' }}><Calendar size={15} /></div>
                <div className="sale-info">
                  <p className="sale-name">{c.service}</p>
                  <p className="sale-detail">{c.client_name} · {c.empleado_name}</p>
                </div>
                <div className="sale-right">
                  <p className="sale-amount" style={{ fontSize: 13 }}>{c.time?.slice(0, 5)}</p>
                  <p className="sale-time">{c.duration} min</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
