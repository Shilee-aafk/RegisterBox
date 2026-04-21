// Mock data for the application

export const mockProducts = [
  { id: 1, name: 'Acondicionador Premium 500ml', barcode: '7891234567891', category: 'Productos', price: 32000, cost: 18000, stock: 38, minStock: 10, unit: 'Unidad' },
  { id: 2, name: 'Cera para Cabello', barcode: '7891234567892', category: 'Productos', price: 18000, cost: 8000, stock: 5, minStock: 15, unit: 'Unidad' },
  { id: 3, name: 'Corte de Cabello Hombre', barcode: '', category: 'Servicios', price: 15000, cost: 3000, stock: 999, minStock: 0, unit: 'Servicio' },
  { id: 4, name: 'Corte de Cabello Mujer', barcode: '', category: 'Servicios', price: 25000, cost: 5000, stock: 999, minStock: 0, unit: 'Servicio' },
  { id: 5, name: 'Gel Fijador 250ml', barcode: '7891234567893', category: 'Productos', price: 12000, cost: 5000, stock: 8, minStock: 20, unit: 'Unidad' },
  { id: 6, name: 'Manicure Completo', barcode: '', category: 'Servicios', price: 20000, cost: 5000, stock: 999, minStock: 0, unit: 'Servicio' },
  { id: 7, name: 'Shampoo Profesional 500ml', barcode: '7891234567890', category: 'Productos', price: 28000, cost: 15000, stock: 45, minStock: 10, unit: 'Unidad' },
  { id: 8, name: 'Tinte Capilar', barcode: '', category: 'Servicios', price: 85000, cost: 20000, stock: 999, minStock: 0, unit: 'Servicio' },
];

export const mockSalesWeek = [
  { day: 'Lun', ventas: 312000, meta: 350000 },
  { day: 'Mar', ventas: 285000, meta: 350000 },
  { day: 'Mié', ventas: 420000, meta: 350000 },
  { day: 'Jue', ventas: 395000, meta: 350000 },
  { day: 'Vie', ventas: 510000, meta: 350000 },
  { day: 'Sáb', ventas: 460000, meta: 400000 },
  { day: 'Dom', ventas: 194420, meta: 300000 },
];

export const mockIncomeVsExpense = [
  { month: 'Ene', ingresos: 8500000, gastos: 6200000 },
  { month: 'Feb', ingresos: 9200000, gastos: 6800000 },
  { month: 'Mar', ingresos: 11000000, gastos: 7100000 },
];

export const mockCategoryPie = [
  { name: 'Servicios', value: 58, color: '#3b82f6' },
  { name: 'Productos', value: 28, color: '#10b981' },
  { name: 'Otro', value: 14, color: '#8b5cf6' },
];

export const mockRecentSales = [
  { id: 1, client: 'Carlos Méndez', detail: '2 productos · Tarjeta', amount: 51170, time: '10:30' },
  { id: 2, client: 'Laura Martínez', detail: '2 productos · Tarjeta', amount: 125400, time: '14:15' },
  { id: 3, client: 'Cliente General', detail: '1 producto · Efectivo', amount: 17850, time: '16:00' },
  { id: 4, client: 'María García', detail: '3 productos · Transferencia', amount: 23800, time: '17:20' },
];

export const mockStockAlerts = [
  { id: 1, name: 'Cera para Cabello', min: 15, current: 5 },
  { id: 2, name: 'Gel Fijador 250ml', min: 20, current: 8 },
];
