// Finanzas mock data
export const mockTransacciones = [
  { id: 1, date: '15 mar', time: '16:00', desc: 'Venta #3', category: 'Ventas', amount: 17850, type: 'ingreso' },
  { id: 2, date: '15 mar', time: '14:15', desc: 'Venta #2 - Laura Martinez', category: 'Ventas', amount: 125400, type: 'ingreso' },
  { id: 3, date: '15 mar', time: '10:30', desc: 'Venta #1 - Carlos Mendez', category: 'Ventas', amount: 51170, type: 'ingreso' },
  { id: 4, date: '13 mar', time: '21:00', desc: 'Compra de productos - Proveedor ABC', category: 'Inventario', amount: 450000, type: 'gasto' },
  { id: 5, date: '09 mar', time: '21:00', desc: 'Pago de electricidad', category: 'Servicios', amount: 180000, type: 'gasto' },
  { id: 6, date: '29 feb', time: '21:00', desc: 'Pago nómina quincenal', category: 'Nómina', amount: 5550000, type: 'gasto' },
];

export const mockFlujoCaja = [
  { day: 'sáb', ingresos: 0, gastos: 0 },
  { day: 'dom', ingresos: 0, gastos: 0 },
  { day: 'lun', ingresos: 0, gastos: 0 },
  { day: 'mar', ingresos: 0, gastos: 0 },
  { day: 'mié', ingresos: 0, gastos: 0 },
  { day: 'jue', ingresos: 17850, gastos: 0 },
  { day: 'vie', ingresos: 194420, gastos: 0 },
];

export const mockGastosCat = [
  { name: 'Inventario', value: 450000, color: '#3b82f6' },
  { name: 'Servicios', value: 180000, color: '#ef4444' },
  { name: 'Nómina', value: 5550000, color: '#f59e0b' },
];

// Automatizaciones mock data
export const mockAutomatizaciones = [
  { id: 1, name: 'Alerta de Stock Bajo', desc: 'Alerta cuando un producto alcanza el stock mínimo configurado', icon: 'package', enabled: true, executions: 12, lastRun: '15/03 08:00' },
  { id: 2, name: 'Recordatorio de Citas', desc: 'Envía recordatorios automáticos antes de las citas', icon: 'calendar', enabled: true, executions: 45, lastRun: '15/03 09:00' },
  { id: 3, name: 'Cumpleaños de Clientes', desc: 'Notifica cuando es el cumpleaños de un cliente para ofrecer descuentos', icon: 'gift', enabled: true, executions: 8, lastRun: null },
  { id: 4, name: 'Meta de Ventas Diarias', desc: 'Alerta cuando se alcanza la meta de ventas diarias', icon: 'target', enabled: true, executions: 5, lastRun: '14/03 18:00' },
  { id: 5, name: 'Alerta de Gastos', desc: 'Notifica cuando los gastos mensuales superan el límite', icon: 'dollar', enabled: false, executions: 2, lastRun: null },
];

export const mockAlertas = [
  { id: 1, type: 'warning', title: 'Stock Bajo: Cera para Cabello', desc: 'El producto "Cera para Cabello" tiene solo 5 unidades. Mínimo recomendado: 15', date: '15/03/2024 08:00', read: false },
  { id: 2, type: 'warning', title: 'Stock Bajo: Gel Fijador', desc: 'El producto "Gel Fijador 250ml" tiene solo 8 unidades. Mínimo recomendado: 20', date: '15/03/2024 08:00', read: false },
  { id: 3, type: 'info', title: 'Recordatorio de Cita', desc: 'Laura Martinez tiene una cita mañana a las 10:00 AM - Corte + Tinte', date: '15/03/2024 09:00', read: true },
  { id: 4, type: 'success', title: 'Meta de Ventas Alcanzada', desc: '¡Felicidades! Se alcanzó la meta de ventas diarias de $500.000', date: '14/03/2024 18:00', read: true },
];
