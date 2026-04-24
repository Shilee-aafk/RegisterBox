import { supabase } from './supabase';

/* ==================== PRODUCTOS ==================== */
export const db = {
  productos: {
    async getAll() {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    async insert(product) {
      const { data, error } = await supabase
        .from('productos')
        .insert([product])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id, updates) {
      const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    async decrementStock(id, qty) {
      const { data, error } = await supabase.rpc('decrement_stock', {
        product_id: id,
        amount: qty,
      });
      if (error) {
        // Fallback: manual decrement
        const { data: prod } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', id)
          .single();
        if (prod) {
          await supabase
            .from('productos')
            .update({ stock: Math.max(0, prod.stock - qty) })
            .eq('id', id);
        }
      }
      return data;
    },
  },

  /* ==================== CLIENTES ==================== */
  clientes: {
    async getAll() {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    async insert(client) {
      const { data, error } = await supabase
        .from('clientes')
        .insert([client])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id, updates) {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    async addCompra(id, amount) {
      const { data: client } = await supabase
        .from('clientes')
        .select('total_compras, num_compras, puntos')
        .eq('id', id)
        .single();
      if (client) {
        await supabase
          .from('clientes')
          .update({
            total_compras: (client.total_compras || 0) + amount,
            num_compras: (client.num_compras || 0) + 1,
            puntos: (client.puntos || 0) + Math.floor(amount / 1000),
          })
          .eq('id', id);
      }
    },
  },

  /* ==================== EMPLEADOS ==================== */
  empleados: {
    async getAll() {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    async insert(emp) {
      const { data, error } = await supabase
        .from('empleados')
        .insert([emp])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id, updates) {
      const { data, error } = await supabase
        .from('empleados')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async toggleActive(id, active) {
      const { data, error } = await supabase
        .from('empleados')
        .update({ active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  /* ==================== CITAS ==================== */
  citas: {
    async getAll() {
      const { data, error } = await supabase
        .from('citas')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) throw error;
      return data;
    },
    async insert(cita) {
      const { data, error } = await supabase
        .from('citas')
        .insert([cita])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id, updates) {
      const { data, error } = await supabase
        .from('citas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase
        .from('citas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /* ==================== TRANSACCIONES ==================== */
  transacciones: {
    async getAll() {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async insert(t) {
      const { data, error } = await supabase
        .from('transacciones')
        .insert([t])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  /* ==================== HORARIOS EMPLEADOS ==================== */
  horarios: {
    async getAll() {
      const { data, error } = await supabase
        .from('horarios_empleados')
        .select('*, empleados(id, name, role)')
        .order('created_at');
      if (error) throw error;
      return data;
    },
    async insert(empleado_id, dia_semana) {
      const { data, error } = await supabase
        .from('horarios_empleados')
        .insert([{ empleado_id, dia_semana }])
        .select('*, empleados(id, name, role)')
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase
        .from('horarios_empleados')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    async deleteAll() {
      const { error } = await supabase
        .from('horarios_empleados')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
  },
};
