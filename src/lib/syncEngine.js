import { localDb } from './localDb';
import { supabase } from './supabase';

/**
 * Descarga datos de Supabase y actualiza la base de datos local.
 * Solo sobreescribe si Supabase devolvió datos (evita borrar datos locales por RLS vacío).
 */
export async function syncDown() {
  try {
    const [
      { data: productos, error: e1 },
      { data: clientes, error: e2 },
      { data: empleados, error: e3 },
      { data: citas, error: e4 },
      { data: transacciones, error: e5 }
    ] = await Promise.all([
      supabase.from('productos').select('*'),
      supabase.from('clientes').select('*'),
      supabase.from('empleados').select('*'),
      supabase.from('citas').select('*'),
      supabase.from('transacciones').select('*')
    ]);

    // Solo reemplazar si la respuesta fue exitosa y tiene datos
    // Si Supabase devuelve null/error (por RLS, red, etc.), NO borrar lo local
    await localDb.transaction('rw', [localDb.productos, localDb.clientes, localDb.empleados, localDb.citas, localDb.transacciones], async () => {
      if (!e1 && productos) { await localDb.productos.clear(); await localDb.productos.bulkAdd(productos); }
      if (!e2 && clientes) { await localDb.clientes.clear(); await localDb.clientes.bulkAdd(clientes); }
      if (!e3 && empleados) { await localDb.empleados.clear(); await localDb.empleados.bulkAdd(empleados); }
      if (!e4 && citas) { await localDb.citas.clear(); await localDb.citas.bulkAdd(citas); }
      if (!e5 && transacciones) { await localDb.transacciones.clear(); await localDb.transacciones.bulkAdd(transacciones); }
    });

    console.log("✅ Sync Down completado.");
  } catch (error) {
    console.error("❌ Error en Sync Down:", error);
    alert("Hubo un error al descargar los datos de tu empresa. Es posible que veas datos antiguos. Error: " + error.message);
  }
}

/**
 * Lee la cola local y sube los cambios pendientes a Supabase.
 * Verifica errores de cada operación antes de borrarla de la cola.
 */
export async function syncUp() {
  try {
    if (!navigator.onLine) return;

    const queue = await localDb.sync_queue.orderBy('timestamp').toArray();
    if (queue.length === 0) return;

    console.log(`⏳ Subiendo ${queue.length} cambios a la nube...`);

    for (const item of queue) {
      try {
        let result;

        if (item.table === 'rpc') {
          result = await supabase.rpc(item.action, item.data);
        } else if (item.action === 'INSERT') {
          result = await supabase.from(item.table).upsert([item.data]);
        } else if (item.action === 'UPDATE') {
          const { id, ...updateData } = item.data;
          result = await supabase.from(item.table).update(updateData).eq('id', id);
        } else if (item.action === 'DELETE') {
          result = await supabase.from(item.table).delete().eq('id', item.data.id);
        }

        // Verificar si Supabase respondió con error
        if (result?.error) {
          console.error(`❌ Supabase rechazó ${item.action} en ${item.table}:`, result.error.message);
          alert(`Hubo un problema guardando en la nube (${item.table}):\n${result.error.message}\n\nPor favor, envíame una captura de este error.`);
          // Si es un error de Supabase (ej. RLS, datos inválidos), lo sacamos de la cola 
          // para no bloquear el resto de los cambios.
          await localDb.sync_queue.delete(item.id);
          continue; 
        }

        // Éxito: eliminar de la cola
        await localDb.sync_queue.delete(item.id);
      } catch (err) {
        console.error(`❌ Error sincronizando item (${item.action} en ${item.table}):`, err);
        break;
      }
    }

    console.log("✅ Sync Up completado.");
  } catch (error) {
    console.error("❌ Error en Sync Up:", error);
  }
}
