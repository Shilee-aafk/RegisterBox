// Clientes mock data
export const mockClientes = [
  { id: 1, name: 'Carlos Mendez', email: 'carlos.mendez@email.com', phone: '+57 300 123 4567', address: 'Calle 45 #12-34', tags: ['VIP', 'Frecuente'], compras: 580000, numCompras: 24, puntos: 580 },
  { id: 2, name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '+57 301 234 5678', address: 'Carrera 7 #23-56', tags: ['Frecuente'], compras: 425000, numCompras: 18, puntos: 425 },
  { id: 3, name: 'Andres Perez', email: 'andres.perez@email.com', phone: '+57 302 345 6789', address: '', tags: [], compras: 185000, numCompras: 8, puntos: 185 },
  { id: 4, name: 'Laura Martinez', email: 'laura.martinez@email.com', phone: '+57 303 456 7890', address: 'Av. 68 #45-12', tags: ['VIP', 'Premium', 'Frecuente'], compras: 920000, numCompras: 32, puntos: 920 },
  { id: 5, name: 'Juan Rodriguez', email: 'juan.rodriguez@email.com', phone: '+57 304 567 8901', address: '', tags: ['Nuevo'], compras: 95000, numCompras: 5, puntos: 95 },
];

// Empleados mock data
export const mockEmpleados = [
  { id: 1, name: 'Sofia Ramirez', role: 'Administrador', email: 'sofia@negocio.com', phone: '+57 310 111 2222', salary: 4500000, since: 'enero 2022', ventas: 0, totalVendido: 0, schedule: { lun: '08:00 - 18:00', mar: '08:00 - 18:00', mie: '08:00 - 18:00', jue: '08:00 - 18:00', vie: '08:00 - 18:00', sab: '09:00 - 14:00', dom: 'Libre' } },
  { id: 2, name: 'Diego Torres', role: 'Gerente', email: 'diego@negocio.com', phone: '+57 311 222 3333', salary: 3200000, since: 'marzo 2022', ventas: 145, totalVendido: 8500000, schedule: { lun: '08:00 - 18:00', mar: '08:00 - 18:00', mie: '08:00 - 18:00', jue: '08:00 - 18:00', vie: '08:00 - 18:00', sab: '09:00 - 14:00', dom: 'Libre' } },
  { id: 3, name: 'Camila Herrera', role: 'Personal', email: 'camila@negocio.com', phone: '+57 312 333 4444', salary: 1800000, since: 'junio 2023', ventas: 98, totalVendido: 4200000, schedule: { lun: '08:00 - 18:00', mar: '08:00 - 18:00', mie: '08:00 - 18:00', jue: '08:00 - 18:00', vie: '08:00 - 18:00', sab: 'Libre', dom: 'Libre' } },
  { id: 4, name: 'Felipe Vargas', role: 'Cajero', email: 'felipe@negocio.com', phone: '+57 313 444 5555', salary: 1600000, since: 'septiembre 2023', ventas: 210, totalVendido: 6100000, schedule: { lun: '08:00 - 18:00', mar: '08:00 - 18:00', mie: '08:00 - 18:00', jue: '08:00 - 18:00', vie: '08:00 - 18:00', sab: '09:00 - 14:00', dom: 'Libre' } },
];

// Citas mock data
export const mockCitas = [
  { id: 1, service: 'Corte de cabello', client: 'Maria Garcia', date: '2026-04-18', time: '09:00', duration: 30, price: 15000, status: 'pendiente', empleado: 'Camila Herrera' },
  { id: 2, service: 'Manicure Completo', client: 'Laura Martinez', date: '2026-04-19', time: '11:00', duration: 60, price: 20000, status: 'pendiente', empleado: 'Sofia Ramirez' },
];
