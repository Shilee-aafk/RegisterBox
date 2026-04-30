import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, DollarSign, TriangleAlert, Plus, Search, SlidersHorizontal, Pencil, Trash2, X, Wand2, CheckCircle, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { localDb as db } from '../lib/localDb';
import { useApp } from '../context/AppContext';
import useBarcodeScanner from '../hooks/useBarcodeScanner';

const EMPTY_FORM = {
  name: '', category: '', categoria_id: '', unit: 'Unidad', cantidad_unidad: 1,
  price: 0, cost: 0, stock: 0, min_stock: 0, barcode: '', sku: '',
  descuento_general: 0, descuento_cliente_frecuente: 0, tipo_promocion: 'Ninguna'
};

export default function Inventario() {
  const { productos, categorias, addCategoria, updateCategoria, deleteCategoria, addProducto, updateProducto, deleteProducto, stockAlerts, formatCurrency: fmt, logAction, confirmAction } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado para gestión de categorías
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ nombre: '', descuento_base: 0 });
  const [editCatId, setEditCatId] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  // Estado para el modal de ingreso rápido de mercadería
  const [stockModal, setStockModal] = useState(null); // { product, qty }
  const [stockSaving, setStockSaving] = useState(false);

  // Toast de notificación
  const [toast, setToast] = useState(null);

  function showToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam && productos.length > 0) {
      const p = productos.find(x => String(x.id) === String(editParam));
      if (p) {
        openEdit(p);
      }
      setSearchParams(new URLSearchParams(), { replace: true });
    }
  }, [searchParams, productos, setSearchParams]);

  const lowStock = stockAlerts.length;
  const totalValue = productos.reduce((sum, p) => sum + p.stock * p.cost, 0);

  const filtered = productos.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Todos' || String(p.categoria_id) === String(filter) || p.category === filter;
    return matchSearch && matchFilter;
  });

  function openNew() { 
    setForm({
      ...EMPTY_FORM,
      categoria_id: categorias.length > 0 ? categorias[0].id : '',
      category: categorias.length > 0 ? categorias[0].nombre : ''
    }); 
    setEditId(null); 
    setShowModal(true); 
  }

  function openEdit(p) {
    setForm({ 
      name: p.name, 
      category: p.category || '', 
      categoria_id: p.categoria_id || '', 
      unit: p.unit, 
      cantidad_unidad: p.cantidad_unidad || 1,
      price: p.price, 
      cost: p.cost, 
      stock: p.stock, 
      min_stock: p.min_stock, 
      barcode: p.barcode || '', 
      sku: p.sku || '',
      descuento_general: p.descuento_general || 0,
      descuento_cliente_frecuente: p.descuento_cliente_frecuente || 0,
      tipo_promocion: p.tipo_promocion || 'Ninguna'
    });
    setEditId(p.id);
    setShowModal(true);
  }

  /* ---- Barcode Scanner Integration ---- */
  const handleScan = useCallback(async (code) => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (showModal || stockModal || showCatModal) return;

    const trimmed = code.trim();
    if (!trimmed) return;

    try {
      let product = await db.productos
        .filter(p => p.barcode === trimmed || p.sku === trimmed)
        .first();

      if (!product) {
        const { data } = await supabase
          .from('productos')
          .select('*')
          .or(`barcode.eq.${trimmed},sku.eq.${trimmed}`)
          .limit(1)
          .maybeSingle();
        product = data;
      }

      if (product) {
        setStockModal({ product, qty: 1 });
      } else {
        setForm({ ...EMPTY_FORM, barcode: trimmed, categoria_id: categorias.length > 0 ? categorias[0].id : '' });
        setEditId(null);
        setShowModal(true);
        showToast('ok', `Código "${trimmed}" no registrado — completa los datos del nuevo producto`);
      }
    } catch (err) {
      console.error('Error en escaneo de inventario:', err);
      showToast('error', 'Error buscando producto escaneado');
    }
  }, [showModal, stockModal, showCatModal, categorias]);

  useBarcodeScanner(handleScan);

  /* ---- Guardar ingreso rápido de mercadería ---- */
  async function handleStockSave() {
    if (!stockModal || stockModal.qty <= 0) return;
    setStockSaving(true);
    try {
      const { product, qty } = stockModal;
      const newStock = (product.stock || 0) + qty;
      await updateProducto(product.id, { stock: newStock });
      await logAction('Ingreso de Mercadería', `+${qty} uds → ${product.name} (Stock: ${product.stock} → ${newStock})`, 'Inventario');
      setStockModal(null);
      showToast('ok', `✓ +${qty} unidades ingresadas a "${product.name}"`);
    } catch (e) {
      showToast('error', 'Error actualizando stock: ' + e.message);
    }
    setStockSaving(false);
  }

  async function generateSKU() {
    if (!form.name.trim()) {
      alert('Por favor, ingresa el nombre del producto primero para generar el SKU.');
      return;
    }
    
    const words = form.name.trim().split(/\s+/);
    const prefix = words.map(w => w.substring(0, 3).toLowerCase()).join('');
    
    try {
      const [dexieResult, supabaseResult] = await Promise.all([
        db.productos.filter(p => p.sku && p.sku.startsWith(prefix + '-')).toArray(),
        supabase.from('productos').select('sku').ilike('sku', `${prefix}-%`)
      ]);
      
      const allSKUs = new Set();
      dexieResult.forEach(p => p.sku && allSKUs.add(p.sku));
      if (supabaseResult.data) {
        supabaseResult.data.forEach(p => p.sku && allSKUs.add(p.sku));
      }
      
      let maxNum = 0;
      for (const sku of allSKUs) {
        const parts = sku.split('-');
        if (parts.length > 1) {
          const num = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      
      const newSku = `${prefix}-${maxNum + 1}`;
      setForm(f => ({ ...f, sku: newSku }));
    } catch (err) {
      console.error('Error al generar SKU:', err);
      alert('Hubo un error al generar el SKU.');
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const selectedCat = categorias.find(c => String(c.id) === String(form.categoria_id));
      const catName = selectedCat ? selectedCat.nombre : form.category;

      const payload = { 
        name: form.name, 
        category: catName, 
        categoria_id: form.categoria_id || null,
        unit: form.unit, 
        cantidad_unidad: form.cantidad_unidad ? Number(form.cantidad_unidad) : 1,
        price: +form.price, 
        cost: +form.cost, 
        stock: +form.stock, 
        min_stock: +form.min_stock, 
        barcode: form.barcode, 
        sku: form.sku || null,
        descuento_general: form.descuento_general ? Number(form.descuento_general) : 0,
        descuento_cliente_frecuente: form.descuento_cliente_frecuente ? Number(form.descuento_cliente_frecuente) : 0,
        tipo_promocion: form.tipo_promocion === 'Ninguna' ? null : form.tipo_promocion
      };

      if (editId) {
        await updateProducto(editId, payload);
        await logAction('Editar Producto', `Actualizó: ${form.name} | P: ${fmt(+form.price)} | S: ${form.stock}`, 'Inventario');
      } else {
        await addProducto(payload);
        await logAction('Agregar Producto', `Añadió al catálogo: ${form.name}`, 'Inventario');
      }
      setShowModal(false);
    } catch (e) { alert('Error guardando: ' + e.message); }
    setSaving(false);
  }

  async function handleDelete(id, name) {
    confirmAction(
      `Eliminar Producto`,
      `¿Estás seguro que deseas eliminar el producto "${name}"?`,
      async () => {
        try { 
          await deleteProducto(id); 
          await logAction(`Eliminar Producto`, `Borró el producto: ${name}`, 'Inventario');
        }
        catch (e) { alert('Error eliminando: ' + e.message); }
      }
    );
  }

  /* ---- CATEGORIAS CRUD ---- */
  function openNewCat() { setCatForm({ nombre: '', descuento_base: 0 }); setEditCatId(null); }
  function openEditCat(c) { setCatForm({ nombre: c.nombre, descuento_base: c.descuento_base || 0 }); setEditCatId(c.id); }

  async function handleCatSave() {
    if (!catForm.nombre.trim()) return;
    setCatSaving(true);
    try {
      if (editCatId) {
        await updateCategoria(editCatId, { nombre: catForm.nombre, descuento_base: +catForm.descuento_base });
        await logAction('Editar Categoría', `Actualizó la categoría: ${catForm.nombre}`, 'Inventario');
        showToast('ok', 'Categoría actualizada exitosamente');
      } else {
        await addCategoria({ nombre: catForm.nombre, descuento_base: +catForm.descuento_base });
        await logAction('Crear Categoría', `Añadió nueva categoría: ${catForm.nombre}`, 'Inventario');
        showToast('ok', 'Categoría creada exitosamente');
      }
      openNewCat();
    } catch (e) { showToast('error', 'Error guardando categoría: ' + e.message); }
    setCatSaving(false);
  }

  function handleCatDelete(c) {
    if (productos.some(p => String(p.categoria_id) === String(c.id) || p.category === c.nombre)) {
      alert('No puedes eliminar esta categoría porque hay productos asignados a ella.');
      return;
    }
    confirmAction('Eliminar Categoría', `¿Estás seguro que deseas eliminar la categoría "${c.nombre}"?`, async () => {
      try {
        await deleteCategoria(c.id);
        await logAction('Eliminar Categoría', `Borró la categoría: ${c.nombre}`, 'Inventario');
        showToast('ok', 'Categoría eliminada');
      } catch (e) { showToast('error', 'Error eliminando: ' + e.message); }
    });
  }

  return (
    <div className="page-content">
      {/* Toast de notificación */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          background: toast.type === 'ok' ? '#10b981' : '#ef4444',
          color: '#fff', borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `0 4px 20px ${toast.type === 'ok' ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)'}`,
          zIndex: 9999, fontSize: 15, fontWeight: 600,
          animation: 'fadeIn .2s ease'
        }}>
          {toast.type === 'ok' && <CheckCircle size={18} />}
          {toast.text}
        </div>
      )}

      {/* Stats */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Total Productos</p>
            <p className="stat-card-value">{productos.length}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#eff6ff' }}>
            <Package size={20} color="#3b82f6" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Valor Inventario</p>
            <p className="stat-card-value" style={{ fontSize: 20 }}>{fmt(totalValue)}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#ecfdf5' }}>
            <DollarSign size={20} color="#10b981" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Stock Bajo</p>
            <p className="stat-card-value">{lowStock}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#fffbeb' }}>
            <TriangleAlert size={20} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="inventory-toolbar">
        <h2>Productos</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => setShowCatModal(true)}>
            <Tag size={15} /> Categorías
          </button>
          <button className="btn-primary" onClick={openNew} id="btn-agregar-producto">
            <Plus size={15} /> Agregar Producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="inventory-filters">
        <div className="search-input-wrap">
          <Search size={14} color="var(--text-muted)" />
          <input placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} id="inv-search" />
        </div>
        <div className="filter-select">
          <SlidersHorizontal size={14} color="var(--text-muted)" />
          <select value={filter} onChange={e => setFilter(e.target.value)} id="inv-filter">
            <option value="Todos">Todas las Categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => {
            const isLow = p.stock < p.min_stock;
            return (
              <tr key={p.id}>
                <td>
                  <div className="product-cell">
                    <div className="product-icon"><Package size={16} /></div>
                    <div>
                      <p className="product-name">{p.name}</p>
                      {p.barcode && <p className="product-barcode">{p.barcode}</p>}
                    </div>
                  </div>
                </td>
                <td><span className="category-badge">{p.category}</span></td>
                <td>
                  <p style={{ fontWeight: 600 }}>{fmt(p.price)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Costo: {fmt(p.cost)}</p>
                </td>
                <td>
                  {isLow ? <span className="stock-low"><TriangleAlert size={12} /> {p.stock} unidades</span>
                         : <span className="stock-good">{p.stock} unidades</span>}
                </td>
                <td>
                  <button className="action-btn edit" title="Editar" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                  <button className="action-btn delete" title="Eliminar" onClick={() => handleDelete(p.id, p.name)}><Trash2 size={15} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal de Producto (Crear/Editar) */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" placeholder="Nombre del producto" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus id="modal-nombre" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="form-input" placeholder="SKU del producto" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} style={{ flex: 1 }} />
                  <button className="btn-secondary" onClick={generateSKU} type="button" title="Generar SKU" style={{ padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wand2 size={16} />
                  </button>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
                    <option value="">Seleccionar Categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unidad</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="form-input" 
                      type="number" 
                      style={{ width: '80px' }} 
                      placeholder="1" 
                      value={form.cantidad_unidad} 
                      onChange={e => setForm(f => ({ ...f, cantidad_unidad: e.target.value }))} 
                      title="Cantidad por Unidad"
                    />
                    <select className="form-select" style={{ flex: 1 }} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                      <option>Unidad</option>
                      <option>Servicio</option>
                      <option>Kg</option>
                      <option>Lt</option>
                      <option>ml</option>
                      <option>grs</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio Venta</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Costo</label>
                  <input className="form-input" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stock Actual</label>
                  <input className="form-input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Mínimo</label>
                  <input className="form-input" type="number" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))} />
                </div>
              </div>
              
              <div style={{ background: 'var(--bg-sidebar-light, #f8fafc)', padding: 14, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-main)' }}>Precios y Promociones</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Promoción Especial</label>
                    <select className="form-select" value={form.tipo_promocion} onChange={e => setForm(f => ({ ...f, tipo_promocion: e.target.value }))}>
                      <option>Ninguna</option>
                      <option>2x1</option>
                      <option>3x2</option>
                      <option>4x3</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Desc. General (%)</label>
                    <input className="form-input" type="number" min="0" max="100" value={form.descuento_general} onChange={e => setForm(f => ({ ...f, descuento_general: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Desc. C. Frecuente (%)</label>
                    <input className="form-input" type="number" min="0" max="100" value={form.descuento_cliente_frecuente} onChange={e => setForm(f => ({ ...f, descuento_cliente_frecuente: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Código de Barras (opcional)</label>
                <input className="form-input" placeholder="7891234567890" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} id="modal-agregar">
                {saving ? 'Guardando…' : editId ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ingreso Rápido de Mercadería */}
      {stockModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setStockModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>📦 Ingreso de Mercadería</h2>
              <button className="modal-close" onClick={() => setStockModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-sidebar-light, #f0fdfa)', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-color, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>{stockModal.product.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Stock actual: <strong style={{ color: 'var(--text-main)' }}>{stockModal.product.stock} {stockModal.product.unit?.toLowerCase() || 'uds'}</strong>
                    {stockModal.product.barcode && <> · {stockModal.product.barcode}</>}
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">¿Cuántas unidades entran?</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={stockModal.qty}
                  onChange={e => setStockModal(prev => ({ ...prev, qty: Math.max(1, +e.target.value || 1) }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleStockSave(); }}
                  autoFocus
                  style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', padding: '12px 16px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#ecfdf5', borderRadius: 10, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Nuevo stock resultante:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                  {(stockModal.product.stock || 0) + (stockModal.qty || 0)} {stockModal.product.unit?.toLowerCase() || 'uds'}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setStockModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleStockSave} disabled={stockSaving}>
                {stockSaving ? 'Guardando…' : `Ingresar +${stockModal.qty}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Categorías */}
      {showCatModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCatModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2><Tag size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Gestionar Categorías</h2>
              <button className="modal-close" onClick={() => setShowCatModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  {editCatId ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 2 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Nombre</label>
                    <input className="form-input" value={catForm.nombre} onChange={e => setCatForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Electrónica" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Desc. Base (%)</label>
                    <input className="form-input" type="number" value={catForm.descuento_base} onChange={e => setCatForm(f => ({ ...f, descuento_base: e.target.value }))} min={0} max={100} />
                  </div>
                  <div style={{ flexShrink: 0, paddingBottom: 2 }}>
                    {editCatId ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-primary" onClick={handleCatSave} disabled={catSaving}>Guardar</button>
                        <button className="btn-secondary" onClick={openNewCat}>Cancelar</button>
                      </div>
                    ) : (
                      <button className="btn-primary" onClick={handleCatSave} disabled={catSaving}>
                        <Plus size={14} /> Añadir
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Categorías Actuales</h3>
                {categorias.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay categorías registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categorias.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</p>
                          {c.descuento_base > 0 && <p style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>Descuento base: {c.descuento_base}%</p>}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="action-btn edit" onClick={() => openEditCat(c)} title="Editar"><Pencil size={14} /></button>
                          <button className="action-btn delete" onClick={() => handleCatDelete(c)} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCatModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
