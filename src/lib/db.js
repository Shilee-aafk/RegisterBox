import { supabase } from './supabase';
import { localDb, generateLocalId } from './localDb';
import { syncUp } from './syncEngine';

// Helper para obtener empresa_id actual
function getEmpresaId() {
  return localStorage.getItem('empresa_id');
}

// Helpers para cola de sincronización
async function queueSync(table, action, data) {
  await localDb.sync_queue.add({ table, action, data, timestamp: Date.now() });
  syncUp(); // Intentar subir en background
}

/* ==================== CATEGORIAS ==================== */
export const db = {
  locales: {
    async getAll() {
      const { data, error } = await supabase.from('locales').select('*').order('nombre');
      if (error) throw error; return data;
    },
    async insert(loc) {
      loc.id = loc.id || generateLocalId('locales');
      loc.empresa_id = loc.empresa_id || getEmpresaId();
      if (!loc.created_at) loc.created_at = new Date().toISOString();
      await localDb.locales.add(loc);
      await queueSync('locales', 'INSERT', loc);
      return loc;
    },
    async update(id, updates) {
      await localDb.locales.update(id, updates);
      await queueSync('locales', 'UPDATE', { id, ...updates });
      return { id, ...updates };
    },
    async delete(id) {
      await localDb.locales.delete(id);
      await queueSync('locales', 'DELETE', { id });
    },
  },
  categorias: {
    async getAll() {
      const { data, error } = await supabase.from('categorias').select('*').order('nombre');
      if (error) throw error; return data;
    },
    async insert(cat) {
      cat.id = cat.id || generateLocalId('categorias');
      cat.empresa_id = cat.empresa_id || getEmpresaId();
      if (!cat.created_at) cat.created_at = new Date().toISOString();
      await localDb.categorias.add(cat);
      await queueSync('categorias', 'INSERT', cat);
      return cat;
    },
    async update(id, updates) {
      await localDb.categorias.update(id, updates);
      await queueSync('categorias', 'UPDATE', { id, ...updates });
      return { id, ...updates };
    },
    async delete(id) {
      await localDb.categorias.delete(id);
      await queueSync('categorias', 'DELETE', { id });
    },
  },

  /* ==================== PRODUCTOS ==================== */
  productos: {
    async getAll() {
      // Se sigue usando como fallback si falla la lectura local en AppContext
      const { data, error } = await supabase.from('productos').select('*').order('name');
      if (error) throw error; return data;
    },
    async insert(product) {
      product.id = product.id || generateLocalId('productos');
      product.empresa_id = product.empresa_id || getEmpresaId();
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
      client.id = client.id || generateLocalId('clientes');
      client.empresa_id = client.empresa_id || getEmpresaId();
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
      emp.id = emp.id || generateLocalId('empleados');
      emp.empresa_id = emp.empresa_id || getEmpresaId();
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
      cita.id = cita.id || generateLocalId('citas');
      cita.empresa_id = cita.empresa_id || getEmpresaId();
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
      t.id = t.id || generateLocalId('transacciones');
      t.empresa_id = t.empresa_id || getEmpresaId();
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
      const h = { id: generateLocalId('horarios_empleados'), empleado_id, dia_semana, hora_inicio, hora_fin, empresa_id: getEmpresaId() };
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
      const now = new Date(Date.now() - tzoffset);
      const today = now.toISOString().split('T')[0];
      const days = ['dom','lun','mar','mie','jue','vie','sab'];
      const dayKey = days[now.getDay()];

      const { data: records, error } = await supabase.from('asistencias_empleados')
        .select('*')
        .eq('empleado_id', empleado_id)
        .eq('fecha', today)
        .order('created_at', { ascending: false });
      if (error) throw error; 

      const { data: turnos } = await supabase.from('horarios_empleados')
        .select('*')
        .eq('empleado_id', empleado_id)
        .eq('dia_semana', dayKey);
      
      const maxTurnos = turnos ? turnos.length : 0;
      const latest = records && records.length > 0 ? records[0] : null;

      let nextAction = 'entrada';
      if (!latest) {
        nextAction = maxTurnos === 0 ? 'completado' : 'entrada';
      } else if (!latest.hora_salida) {
        nextAction = 'salida';
      } else {
        const completedCount = records.filter(r => r.hora_entrada && r.hora_salida).length;
        nextAction = completedCount >= maxTurnos ? 'completado' : 'entrada';
      }

      return { nextAction, latestRecord: latest, maxTurnos };
    },
    async marcar(empleado_id) {
      const estado = await this.getEstadoHoy(empleado_id);
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const now = new Date(Date.now() - tzoffset);
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toISOString().split('T')[1].substring(0, 5);

      if (estado.nextAction === 'completado') {
        return { action: 'completado', data: estado.latestRecord };
      }

      if (estado.nextAction === 'entrada') {
        const data = { id: generateLocalId('asistencias_empleados'), empleado_id, fecha, hora_entrada: hora, empresa_id: getEmpresaId() };
        const { error } = await supabase.from('asistencias_empleados').insert([data]);
        if (error) throw error;
        return { action: 'entrada', data };
      } else {
        const { error } = await supabase.from('asistencias_empleados').update({ hora_salida: hora }).eq('id', estado.latestRecord.id);
        if (error) throw error;
        return { action: 'salida', data: { ...estado.latestRecord, hora_salida: hora } };
      }
    }
  },

  /* ==================== AUDITORIA ==================== */
  audit: {
    async log(empleado_id, accion, detalle, modulo) {
      const item = {
        id: generateLocalId('audit_logs'),
        empleado_id,
        accion,
        detalle,
        modulo,
        empresa_id: getEmpresaId(),
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
