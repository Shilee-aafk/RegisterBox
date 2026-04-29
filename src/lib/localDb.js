import Dexie from 'dexie';

// Inicializamos la base de datos local
export const localDb = new Dexie('GestorProDB');

localDb.version(3).stores({
  categorias: 'id, nombre',
  productos: 'id, category, categoria_id, tipo_promocion, name',
  clientes: 'id, name',
  empleados: 'id, name, role',
  citas: 'id, date, status',
  transacciones: 'id, created_at',
  audit_logs: 'id, created_at, modulo',
  
  // Tabla especial para mantener la cola de cambios que deben enviarse a Supabase
  // action puede ser: 'INSERT', 'UPDATE', 'DELETE'
  sync_queue: '++id, table, action, timestamp'
});

export function generateLocalId(table) {
  // Supabase tiene algunas tablas con ID UUID (nuevas) y otras con BIGINT (viejas).
  const uuidTables = ['audit_logs', 'horarios_empleados', 'asistencias_empleados', 'empresas', 'perfiles_empresa', 'categorias'];
  
  if (uuidTables.includes(table)) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Para productos, clientes, empleados, citas, transacciones:
  return Math.floor(Date.now() * 10) + Math.floor(Math.random() * 10);
}
