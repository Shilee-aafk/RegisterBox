import Dexie from 'dexie';

// Inicializamos la base de datos local
export const localDb = new Dexie('GestorProDB');

// Definimos el esquema de la base de datos (tablas y sus índices principales)
// NOTA: No es necesario definir todas las columnas, solo las que se usarán para buscar (índices).
// "id" es siempre la clave primaria en nuestras tablas porque usamos UUIDs.
localDb.version(1).stores({
  productos: 'id, category, name',
  clientes: 'id, name',
  empleados: 'id, name, role',
  citas: 'id, date, status',
  transacciones: 'id, created_at',
  audit_logs: 'id, created_at, modulo',
  
  // Tabla especial para mantener la cola de cambios que deben enviarse a Supabase
  // action puede ser: 'INSERT', 'UPDATE', 'DELETE'
  sync_queue: '++id, table, action, timestamp'
});

// Función utilitaria para generar UUIDs locales si estamos offline
export function generateLocalId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback si no está disponible randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
