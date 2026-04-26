import { supabase } from './supabase';
import { localDb, generateLocalId } from './localDb';
import { syncUp } from './syncEngine';

// Helpers para cola de sincronización
async function queueSync(table, action, data) {
  await localDb.sync_queue.add({ table, action, data, timestamp: Date.now() });
  syncUp(); // Intentar subir en background
}

/* ==================== PRODUCTOS ==================== */
export const db = {
  productos: {
    async getAll() {
      // Se sigue usando como fallback si falla la lectura local en AppContext
      const { data, error } = await supabase.from('productos').select('*').order('name');
      if (error) throw error; return data;
    },
    async insert(product) {
      product.id = product.id || generateLocalId();
      if (!product.created_at) product.created_at = new Date().toISOString();
      await localDb.productos.add(product);
      await queueSync('productos', 'INSERT', product);
      return product;
    },
    async update(id, updates) {
      await localDb.productos.update(id, updates);
      await queueSync('productos', 'UPDATE', { id, ...updates });
      return { id, ...updates };
    },
    async delete(id) {
      await localDb.productos.delete(id);
      await queueSync('productos', 'DELETE', { id });
    },
    async decrementStock(id, qty) {
      const prod = await localDb.productos.get(id);
      if (prod) {
        await localDb.productos.update(id, { stock: Math.max(0, prod.stock - qty) });
      }
      await queueSync('rpc', 'decrement_stock', { product_id: id, amount: qty });
    },
  },

  /* ==================== CLIENTES ==================== */
  clientes: {
    async getAll() {
      const { data, error } = await supabase.from('clientes').select('*').order('name');
      if (error) throw error; return data;
    },
    async insert(client) {
      client.id = client.id || generateLocalId();
      if (!client.created_at) client.created_at = new Date().toISOString();
      await localDb.clientes.add(client);
      await queueSync('clientes', 'INSERT', client);
      return client;
    },
    async update(id, updates) {
      await localDb.clientes.update(id, updates);
      await queueSync('clientes', 'UPDATE', { id, ...updates });
      return { id, ...updates };
    },
    async delete(id) {
      await localDb.clientes.delete(id);
      await queueSync('clientes', 'DELETE', { id });
    },
    async addCompra(id, amount) {
      const client = await localDb.clientes.get(id);
      if (client) {
        const nextTotal = (client.total_compras || 0) + amount;
        const nextNum = (client.num_compras || 0) + 1;
        const nextPts = (client.puntos || 0) + Math.floor(amount / 1000);
        await localDb.clientes.update(id, {
          total_compras: nextTotal,
          num_compras: nextNum,
          puntos: nextPts,
        });
        await queueSync('clientes', 'UPDATE', { id, total_compras: nextTotal, num_compras: nextNum, puntos: nextPts });
      }
    },
  },

  /* ==================== EMPLEADOS ==================== */
  empleados: {
    async getAll() {
      const { data, error } = await supabase.from('empleados').select('*').order('name');
      if (error) throw error; return data;
    },
    async insert(emp) {
      emp.id = emp.id || generateLocalId();
      if (!emp.created_at) emp.created_at = new Date().toISOString();
      await localDb.empleados.add(emp);
      await queueSync('empleados', 'INSERT', emp);
      return emp;
    },
    async update(id, updates) {
      await localDb.empleados.update(id, updates);
      await queueSync('empleados', 'UPDATE', { id, ...updates });
      return { id, ...updates };
    },
    async toggleActive(id, active) {
      await localDb.empleados.update(id, { active });
      await queueSync('empleados', 'UPDATE', { id, active });
      return { id, active };
    },
    async delete(id) {
      await localDb.empleados.delete(id);
      await queueSync('empleados', 'DELETE', { id });
    },
  },

  /* ==================== CITAS ==================== */
  citas: {
    async getAll() {
      const { data, error } = await supabase.from('citas').select('*').order('date', { ascending: true }).order('time', { ascending: true });
      if (error) throw error; return data;
    },
    async insert(cita) {
      cita.id = cita.id || generateLocalId();
      if (!cita.created_at) cita.created_at = new Date().toISOString();
      await localDb.citas.add(cita);
      await queueSync('citas', 'INSERT', cita);
      return cita;
    },
    async update(id, updates) {
      await localDb.citas.update(id, updates);
      await queueSync('citas', 'UPDATE', { id, ...updates });
      return { id, ...updates };
    },
    async delete(id) {
      await localDb.citas.delete(id);
      await queueSync('citas', 'DELETE', { id });
    },
  },

  /* ==================== TRANSACCIONES ==================== */
  transacciones: {
    async getAll() {
      const { data, error } = await supabase.from('transacciones').select('*').order('created_at', { ascending: false });
      if (error) throw error; return data;
    },
    async insert(t) {
      t.id = t.id || generateLocalId();
      if (!t.created_at) t.created_at = new Date().toISOString();
      await localDb.transacciones.add(t);
      await queueSync('transacciones', 'INSERT', t);
      return t;
    },
    async delete(id) {
      await localDb.transacciones.delete(id);
      await queueSync('transacciones', 'DELETE', { id });
    },
  },

  /* ==================== HORARIOS EMPLEADOS ==================== */
  horarios: {
    async getAll() {
      const { data, error } = await supabase.from('horarios_empleados').select('*');
      if (error) throw error; return data;
    },
    async insert(empleado_id, dia_semana, hora_inicio, hora_fin) {
      const h = { id: generateLocalId(), empleado_id, dia_semana, hora_inicio, hora_fin };
      await queueSync('horarios_empleados', 'INSERT', h);
      return h;
    },
    async delete(id) {
      await queueSync('horarios_empleados', 'DELETE', { id });
    },
    async deleteAll() {
      await supabase.from('horarios_empleados').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    },
  },

  /* ==================== ASISTENCIAS EMPLEADOS ==================== */
  asistencias: {
    async getReporteMes(year, month) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      const { data, error } = await supabase.from('asistencias_empleados').select(`*, empleados (name, role)`).gte('fecha', start).lte('fecha', end).order('fecha', { ascending: false });
      if (error) throw error; return data;
    },
    async getEstadoHoy(empleado_id) {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
      const { data, error } = await supabase.from('asistencias_empleados').select('*').eq('empleado_id', empleado_id).eq('fecha', today).maybeSingle();
      if (error) throw error; return data;
    },
    async marcar(empleado_id) {
      await queueSync('rpc', 'marcar_asistencia', { p_empleado_id: empleado_id });
      return { action: 'Encolado', data: null };
    }
  },

  /* ==================== AUDITORIA ==================== */
  audit: {
    async log(empleado_id, accion, detalle, modulo) {
      const item = {
        id: generateLocalId(),
        empleado_id,
        accion,
        detalle,
        modulo,
        created_at: new Date().toISOString()
      };
      await localDb.audit_logs.add(item);
      await queueSync('audit_logs', 'INSERT', item);
    },
    async getRecent(limit = 100) {
      const { data, error } = await supabase.from('audit_logs').select(`*, empleados (name, role)`).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error; return data;
    }
  }
};
