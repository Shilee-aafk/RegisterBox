import { localDb } from './localDb';
import { supabase } from './supabase';

/**
 * Función encargada de descargar los datos de Supabase y guardarlos en LocalDb
 * Esto asegura que la base de datos local siempre esté actualizada con la nube.
 */
export async function syncDown() {
  try {
    // 1. Descargar todo de Supabase (en una app real se manejarían fechas de modificación para no descargar todo)
    const [
      { data: productos },
      { data: clientes },
      { data: empleados },
      { data: citas },
      { data: transacciones }
    ] = await Promise.all([
      supabase.from('productos').select('*'),
      supabase.from('clientes').select('*'),
      supabase.from('empleados').select('*'),
      supabase.from('citas').select('*'),
      supabase.from('transacciones').select('*')
    ]);

    // 2. Limpiar e insertar en localDb usando transacciones de Dexie para máxima velocidad
    await localDb.transaction('rw', [localDb.productos, localDb.clientes, localDb.empleados, localDb.citas, localDb.transacciones], async () => {
      
      if (productos?.length) { await localDb.productos.clear(); await localDb.productos.bulkAdd(productos); }
      if (clientes?.length) { await localDb.clientes.clear(); await localDb.clientes.bulkAdd(clientes); }
      if (empleados?.length) { await localDb.empleados.clear(); await localDb.empleados.bulkAdd(empleados); }
      if (citas?.length) { await localDb.citas.clear(); await localDb.citas.bulkAdd(citas); }
      if (transacciones?.length) { await localDb.transacciones.clear(); await localDb.transacciones.bulkAdd(transacciones); }
      
    });

    console.log("✅ Sync Down completado: Base de datos local actualizada con la nube.");
  } catch (error) {
    console.error("❌ Error en Sync Down:", error);
  }
}

/**
 * Función encargada de leer la cola local (sync_queue) y subir los cambios a Supabase.
 */
export async function syncUp() {
  try {
    const isOnline = navigator.onLine;
    if (!isOnline) return; // Si no hay internet, no intentar subir.

    // Traer todos los cambios pendientes, ordenados por antigüedad
    const queue = await localDb.sync_queue.orderBy('timestamp').toArray();
    if (queue.length === 0) return;

    console.log(`⏳ Intentando subir ${queue.length} cambios a la nube...`);

    for (const item of queue) {
      try {
        if (item.table === 'rpc') {
          await supabase.rpc(item.action, item.data);
        } else if (item.action === 'INSERT') {
          await supabase.from(item.table).insert([item.data]);
        } else if (item.action === 'UPDATE') {
          await supabase.from(item.table).update(item.data).eq('id', item.data.id);
        } else if (item.action === 'DELETE') {
          await supabase.from(item.table).delete().eq('id', item.data.id);
        }
        
        // Si funcionó, eliminamos el item de la cola
        await localDb.sync_queue.delete(item.id);
      } catch (err) {
        console.error(`❌ Error sincronizando item ${item.id} (${item.action} en ${item.table}):`, err);
        // Si hay un error, nos detenemos para no romper el orden y probar luego
        break; 
      }
    }
    
    console.log("✅ Sync Up completado. Cola limpia.");
  } catch (error) {
    console.error("❌ Error en Sync Up:", error);
  }
}
