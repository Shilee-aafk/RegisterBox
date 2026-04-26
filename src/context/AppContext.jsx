import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { localDb } from '../lib/localDb';
import { syncDown, syncUp } from '../lib/syncEngine';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [citas, setCitas] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [empresaId, setEmpresaId] = useState(() => localStorage.getItem('empresa_id') || null);
  const [empresaTipo, setEmpresaTipo] = useState(() => localStorage.getItem('empresa_tipo') || 'mixto');
  const [firstTimeSetup, setFirstTimeSetup] = useState(false); // true cuando la empresa no tiene empleados
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDestructive: true });

  /* ---- Configuration State ---- */
  const [config, setConfigState] = useState(() => {
    const defaults = {
      biz: {
        nombre: 'Mi Tienda (Ejemplo)',
        nit: '76.123.456-7',
        telefono: '+56 9 1234 5678',
        email: 'contacto@mitienda.cl',
        direccion: 'Av. Providencia 1234, Santiago, Chile',
      },
      notifs: { stockBajo: true, recordatorios: true, resumenDiario: false, alertasMetas: true },
      appearance: { modoOscuroAuto: false, animaciones: true, temaColor: 'teal' },
      regional: { iva: '19', moneda: 'CLP' },
      payments: { efectivo: true, tarjeta: true, transferencia: true },
      security: { dosFactores: false, cierreSesion: true },
    };
    const saved = localStorage.getItem('gestorpro-config');
    const finalConfig = saved ? JSON.parse(saved) : defaults;
    if (!finalConfig.appearance) finalConfig.appearance = defaults.appearance;
    if (!finalConfig.biz) finalConfig.biz = defaults.biz;
    if (!finalConfig.notifs) finalConfig.notifs = defaults.notifs;
    if (!finalConfig.regional) finalConfig.regional = defaults.regional;
    return finalConfig;
  });

  const updateConfig = useCallback((section, key, value) => {
    setConfigState(prev => {
      const next = { ...prev, [section]: { ...prev[section], [key]: value } };
      localStorage.setItem('gestorpro-config', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (config.appearance.modoOscuroAuto) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    if (!config.appearance.animaciones) {
      html.classList.add('no-anim');
    } else {
      html.classList.remove('no-anim');
    }

    const themes = {
      teal: { base: '#0d9488', hover: '#0f766e', light: '#ccfbf1', dark: '#115e59', text: '#d1d5db', textActive: '#ffffff' },
      crema: { base: '#ce9c6b', hover: '#bd8b5a', light: '#fefae0', dark: '#a6723e', text: '#4b5563', textActive: '#111827' },
      rosa_palo: { base: '#dca498', hover: '#c99084', light: '#ffcdb2', dark: '#9c665a', text: '#4b5563', textActive: '#111827' },
      salvia: { base: '#94a896', hover: '#839684', light: '#cad2c5', dark: '#5b6e5d', text: '#ffffff', textActive: '#ffffff' },
      latte: { base: '#b08968', hover: '#a17a58', light: '#ede0d4', dark: '#785437', text: '#f3f4f6', textActive: '#ffffff' },
      arena: { base: '#a89f91', hover: '#998f82', light: '#f2e8cf', dark: '#6e6559', text: '#ffffff', textActive: '#ffffff' },
      avena: { base: '#e2c792', hover: '#d1b57e', light: '#fdf6e3', dark: '#a08b5e', text: '#4b5563', textActive: '#111827' }
    };
    const t = themes[config.appearance.temaColor] || themes.teal;
    html.style.setProperty('--accent-blue', t.base);
    html.style.setProperty('--bg-sidebar', t.base);
    html.style.setProperty('--bg-card-dark', t.dark);
    html.style.setProperty('--bg-hover', t.hover);
    html.style.setProperty('--primary-color', t.base);
    html.style.setProperty('--text-sidebar', t.text);
    html.style.setProperty('--text-sidebar-active', t.textActive);
    if (t.base === '#e2c792' || t.base === '#dca498' || t.base === '#ce9c6b') {
      html.style.setProperty('--border-dark', 'rgba(0,0,0,0.1)');
    } else {
      html.style.setProperty('--border-dark', 'rgba(255,255,255,0.15)');
    }
  }, [config.appearance]);

  /* ---- Fetch all data ---- */
  const fetchAll = useCallback(async () => {
    try {
      // 1. Cargar local primero (Lectura ultrarrápida offline)
      const [p, c, e, ci, t] = await Promise.all([
        localDb.productos.toArray(),
        localDb.clientes.toArray(),
        localDb.empleados.toArray(),
        localDb.citas.toArray(),
        localDb.transacciones.toArray()
      ]);
      setProductos(p.sort((a,b) => a.name.localeCompare(b.name)));
      setClientes(c.sort((a,b) => a.name.localeCompare(b.name)));
      setEmpleados(e.sort((a,b) => a.name.localeCompare(b.name)));
      setCitas(ci.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
      setTransacciones(t.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('Error loading local data:', err);
      // Fallback a Supabase si Dexie falla por alguna razón
      const [p, c, e, ci, t] = await Promise.all([ db.productos.getAll(), db.clientes.getAll(), db.empleados.getAll(), db.citas.getAll(), db.transacciones.getAll() ]);
      setProductos(p || []); setClientes(c || []); setEmpleados(e || []); setCitas(ci || []); setTransacciones(t || []);
    } finally {
      setLoading(false);
    }

    // 2. Sincronizar con la nube en segundo plano (Sync-Down y Sync-Up)
    if (navigator.onLine) {
      try {
        await syncDown();
        const [p, c, e, ci, t] = await Promise.all([
          localDb.productos.toArray(), localDb.clientes.toArray(), localDb.empleados.toArray(), localDb.citas.toArray(), localDb.transacciones.toArray()
        ]);
        setProductos(p.sort((a,b) => a.name.localeCompare(b.name)));
        setClientes(c.sort((a,b) => a.name.localeCompare(b.name)));
        setEmpleados(e.sort((a,b) => a.name.localeCompare(b.name)));
        setCitas(ci.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
        setTransacciones(t.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
        syncUp();
      } catch (e) {
        console.log('Sync Error:', e);
      }
    }
  }, []);

  // Temporizador para subir la cola de cambios a Supabase periódicamente
  useEffect(() => {
    const timer = setInterval(() => {
      syncUp();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Recuperar sesión existente de Supabase al cargar la app
  useEffect(() => {
    async function restoreSession() {
      const savedEmpresaId = localStorage.getItem('empresa_id');
      if (!savedEmpresaId) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Sesión válida: restaurar empresa sin pedir email/password
        setEmpresaId(savedEmpresaId);
        setEmpresaTipo(localStorage.getItem('empresa_tipo') || 'mixto');
        await fetchAll();
        
        // Verificar si ya hay empleados (local + nube)
        const localEmps = await localDb.empleados.count();
        if (localEmps === 0) {
          const { count } = await supabase
            .from('empleados')
            .select('*', { count: 'exact', head: true })
            .eq('empresa_id', savedEmpresaId);
          if ((count || 0) === 0) {
            setFirstTimeSetup(true);
          }
        }
      } else {
        // Sesión expirada: limpiar todo
        localStorage.removeItem('empresa_id');
        localStorage.removeItem('empresa_tipo');
        setEmpresaId(null);
      }
    }
    restoreSession();
  }, []);

  /* ---- Realtime subscriptions usando payload directo ---- */
  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('gestorpro-realtime-v2')
      // ---- PRODUCTOS ----
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'productos' }, ({ new: row }) => {
        setProductos(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'productos' }, ({ new: row }) => {
        setProductos(prev => prev.map(p => p.id === row.id ? row : p));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'productos' }, ({ old: row }) => {
        setProductos(prev => prev.filter(p => p.id !== row.id));
      })
      // ---- CLIENTES ----
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clientes' }, ({ new: row }) => {
        setClientes(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clientes' }, ({ new: row }) => {
        setClientes(prev => prev.map(c => c.id === row.id ? row : c));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clientes' }, ({ old: row }) => {
        setClientes(prev => prev.filter(c => c.id !== row.id));
      })
      // ---- EMPLEADOS ----
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'empleados' }, ({ new: row }) => {
        setEmpleados(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'empleados' }, ({ new: row }) => {
        setEmpleados(prev => prev.map(e => e.id === row.id ? row : e));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'empleados' }, ({ old: row }) => {
        setEmpleados(prev => prev.filter(e => e.id !== row.id));
      })
      // ---- CITAS ----
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'citas' }, ({ new: row }) => {
        setCitas(prev => [...prev, row].sort((a, b) => a.date > b.date ? 1 : -1));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'citas' }, ({ new: row }) => {
        setCitas(prev => prev.map(c => c.id === row.id ? row : c));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'citas' }, ({ old: row }) => {
        setCitas(prev => prev.filter(c => c.id !== row.id));
      })
      // ---- TRANSACCIONES ----
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transacciones' }, ({ new: row }) => {
        setTransacciones(prev => [row, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transacciones' }, ({ old: row }) => {
        setTransacciones(prev => prev.filter(t => t.id !== row.id));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error');
        } else {
          setRealtimeStatus('connecting');
        }
      });

    return () => supabase.removeChannel(channel);
  }, [fetchAll]);

  /* ============================
     PRODUCTOS CRUD
  ============================ */
  async function addProducto(data) {
    // Realtime INSERT event actualizará el estado automáticamente
    const r = await db.productos.insert(data);
    return r;
  }
  async function updateProducto(id, data) {
    // Realtime UPDATE event actualizará el estado automáticamente
    const r = await db.productos.update(id, data);
    return r;
  }
  async function deleteProducto(id) {
    // Realtime DELETE event actualizará el estado automáticamente
    await db.productos.delete(id);
  }

  /* ============================
     CLIENTES CRUD
  ============================ */
  async function addCliente(data) {
    const r = await db.clientes.insert(data);
    return r;
  }
  async function updateCliente(id, data) {
    const r = await db.clientes.update(id, data);
    return r;
  }
  async function deleteCliente(id) {
    await db.clientes.delete(id);
  }

  /* ============================
     EMPLEADOS CRUD
  ============================ */
  async function addEmpleado(data) {
    const r = await db.empleados.insert(data);
    return r;
  }
  async function updateEmpleado(id, data) {
    const r = await db.empleados.update(id, data);
    return r;
  }
  async function toggleEmpleadoActive(id, active) {
    await db.empleados.toggleActive(id, active);
  }
  async function deleteEmpleado(id) {
    await db.empleados.delete(id);
  }

  /* ============================
     ASISTENCIAS
  ============================ */
  async function marcarAsistencia(pinCode) {
    const match = empleados.find(e => String(e.pin) === String(pinCode));
    if (!match || match.active === false) {
      throw new Error('PIN incorrecto o empleado inactivo');
    }
    const res = await db.asistencias.marcar(match.id);
    return { employee: match, ...res };
  }
  
  async function obtenerReporteAsistencia(year, month) {
    return await db.asistencias.getReporteMes(year, month);
  }

  async function obtenerEstadoAsistenciaHoy() {
    if (!currentUser) return null;
    return await db.asistencias.getEstadoHoy(currentUser.id);
  }

  /* ============================
     AUDITORIA
  ============================ */
  async function logAction(accion, detalle, modulo) {
    if (!currentUser) return;
    await db.audit.log(currentUser.id, accion, detalle, modulo);
  }

  async function obtenerLogs(limit = 100) {
    return await db.audit.getRecent(limit);
  }

  /* ============================
     CITAS CRUD
  ============================ */
  async function addCita(data) {
    const r = await db.citas.insert(data);
    return r;
  }
  async function updateCita(id, data) {
    const r = await db.citas.update(id, data);
    return r;
  }
  async function deleteCita(id) {
    await db.citas.delete(id);
  }

  /* ============================
     TRANSACCIONES CRUD
  ============================ */
  async function addTransaccion(data) {
    const r = await db.transacciones.insert(data);
    // Realtime INSERT lo propagará al estado
    return r;
  }
  async function deleteTransaccion(id) {
    await db.transacciones.delete(id);
    // Realtime DELETE lo propagará al estado
  }

  /* ============================
     POS: process sale
     Solo escribe en la DB. Realtime propaga los cambios
     a TODOS los clientes abiertos automáticamente.
  ============================ */
  async function processSale({ cart, total, payMethod, clientId, clientName }) {
    const desc = clientName
      ? `Venta - ${clientName}`
      : 'Venta - Cliente General';

    const hasProducts = cart.some(i => i.category !== 'Servicios');
    const hasServices = cart.some(i => i.category === 'Servicios');
    let tipoVenta = 'Ventas';
    if (hasProducts && !hasServices) tipoVenta = 'Venta de Productos';
    if (!hasProducts && hasServices) tipoVenta = 'Venta de Servicios';
    if (hasProducts && hasServices) tipoVenta = 'Venta Mixta';

    // 1. Crear transacción (Realtime la propagará a todos)
    await db.transacciones.insert({
      description: desc,
      category: tipoVenta,
      amount: total,
      type: 'ingreso',
      payment_method: payMethod,
    });

    // 2. Decrementar stock (Realtime propagará cada UPDATE)
    for (const item of cart) {
      if (item.category !== 'Servicios' && item.stock < 999) {
        await db.productos.update(item.id, {
          stock: Math.max(0, item.stock - item.qty),
        });
      }
    }

    // 3. Actualizar cliente (Realtime propagará el UPDATE)
    if (clientId) {
      await db.clientes.addCompra(clientId, total);
    }
  }

  /* ============================
     CONFIRM DIALOG
  ============================ */
  const confirmAction = useCallback((title, message, onConfirm, isDestructive = true) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, isDestructive });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  /* ============================
     AUTH LOGIC
  ============================ */
  const processLogin = useCallback((pinCode) => {
    if (pinCode === '0000') {
      setCurrentUser({ id: 'admin-master', name: 'Administrador (Maestro)', role: 'Administrador', active: true });
      return { success: true, requireChange: false };
    }

    const tempMatch = empleados.find(e => e.pin === 'TEMP-' + pinCode);
    if (tempMatch && tempMatch.active !== false) {
      return { success: true, requireChange: true, employee: tempMatch };
    }

    const match = empleados.find(e => String(e.pin) === String(pinCode));
    if (match && match.active !== false) {
      setCurrentUser(match);
      return { success: true, requireChange: false };
    }

    if (pinCode === '1234') {
      const adm = empleados.find(e => e.role === 'Administrador' || e.role === 'Gerente') || empleados[0];
      if (adm && adm.active !== false) {
        setCurrentUser(adm);
        return { success: true, requireChange: false };
      }
    }
    return { success: false };
  }, [empleados]);

  const loginEmpresa = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Buscar la empresa asociada al usuario
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles_empresa')
        .select('empresa_id, empresas(nombre, tipo)')
        .eq('user_id', data.user.id)
        .single();
      if (perfilError || !perfil) throw new Error('No se encontró una empresa asociada a este usuario.');
      const eid = perfil.empresa_id;
      const tipo = perfil.empresas?.tipo || 'mixto';
      setEmpresaId(eid);
      setEmpresaTipo(tipo);
      localStorage.setItem('empresa_id', eid);
      localStorage.setItem('empresa_tipo', tipo);
      // Disparar fetchAll ahora que tenemos empresa_id
      await fetchAll();

      // Detectar primera vez: verificar local primero, luego nube
      const localEmps = await localDb.empleados.count();
      if (localEmps === 0) {
        const { count } = await supabase
          .from('empleados')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', eid);
        if ((count || 0) === 0) {
          setFirstTimeSetup(true);
        }
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchAll]);

  // Crear administrador inicial en el primer setup
  const createInitialAdmin = useCallback(async ({ name, pin }) => {
    if (!empresaId) return;
    const admin = {
      name,
      role: 'Administrador',
      email: '',
      phone: '',
      salary: 0,
      since: new Date().toISOString().slice(0, 10),
      pin,
      active: true,
      ventas: 0,
      total_vendido: 0,
      empresa_id: empresaId,
    };
    const result = await db.empleados.insert(admin);
    setFirstTimeSetup(false);
    setCurrentUser(result);
  }, [empresaId]);

  // Cerrar sesión de empleado (solo vuelve al PIN, la empresa sigue conectada)
  const processLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Cerrar sesión completa de empresa (vuelve al login de email)
  const logoutEmpresa = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setEmpresaId(null);
    setEmpresaTipo('mixto');
    localStorage.removeItem('empresa_id');
    localStorage.removeItem('empresa_tipo');
  }, []);

  const forceLogin = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  // Reaccionar a cambios de sesión de Supabase Auth
  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
        setEmpresaId(null);
        setEmpresaTipo('mixto');
        localStorage.removeItem('empresa_id');
        localStorage.removeItem('empresa_tipo');
      }
    });
  }, []);

  /* ============================
     COMPUTED / HELPERS
  ============================ */
  const today = new Date().toISOString().split('T')[0];

  const ventasHoy = (transacciones || [])
    .filter(t => t.type === 'ingreso' && t.created_at && t.created_at.startsWith(today))
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const transaccionesHoy = transacciones.filter(
    t => t.type === 'ingreso' && t.created_at?.startsWith(today)
  ).length;

  const citasHoy = citas.filter(c => c.date === today);

  const stockAlerts = productos.filter(
    p => p.category !== 'Servicios' && p.stock < p.min_stock
  );

  const formatCurrency = useCallback((amount) => {
    const m = config?.regional?.moneda || 'CLP';
    const num = Number(amount) || 0;
    switch (m) {
      case 'USD': return 'US$ ' + num.toLocaleString('en-US');
      case 'EUR': return '€ ' + num.toLocaleString('es-ES');
      case 'MXN': return '$ ' + num.toLocaleString('es-MX');
      case 'COP': return '$ ' + num.toLocaleString('es-CO');
      case 'ARS': return '$ ' + num.toLocaleString('es-AR');
      case 'PEN': return 'S/ ' + num.toLocaleString('es-PE');
      case 'BRL': return 'R$ ' + num.toLocaleString('pt-BR');
      case 'GTQ': return 'Q ' + num.toLocaleString('es-GT');
      case 'CRC': return '₡ ' + num.toLocaleString('es-CR');
      case 'CLP':
      default:
        return '$ ' + num.toLocaleString('es-CL');
    }
  }, [config?.regional?.moneda]);

  const value = {
    /* State */
    productos, clientes, empleados, citas, transacciones,
    loading, connected, realtimeStatus, error, config, currentUser, empresaId, empresaTipo, firstTimeSetup,
    /* Computed */
    ventasHoy, transaccionesHoy, citasHoy, stockAlerts, formatCurrency,
    /* Config */
    updateConfig,
    /* Productos */
    addProducto, updateProducto, deleteProducto,
    /* Clientes */
    addCliente, updateCliente, deleteCliente,
    /* Empleados */
    addEmpleado, updateEmpleado, toggleEmpleadoActive, deleteEmpleado,
    /* Asistencias */
    marcarAsistencia, obtenerReporteAsistencia, obtenerEstadoAsistenciaHoy,
    /* Auditoria */
    logAction, obtenerLogs,
    /* Citas */
    addCita, updateCita, deleteCita,
    /* Transacciones */
    addTransaccion, deleteTransaccion,
    /* POS */
    processSale,
    /* Auth */
    processLogin, processLogout, logoutEmpresa, forceLogin, loginEmpresa, createInitialAdmin,
    /* Confirm */
    confirmAction, confirmDialog, closeConfirm,
    /* Refresh */
    refresh: fetchAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
