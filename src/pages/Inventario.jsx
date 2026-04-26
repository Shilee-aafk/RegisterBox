import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, DollarSign, TriangleAlert, Plus, Search, SlidersHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';


const EMPTY_FORM = {
  name: '', category: 'Productos', unit: 'Unidad',
  price: 0, cost: 0, stock: 0, min_stock: 0, barcode: '',
};

export default function Inventario() {
  const { productos, addProducto, updateProducto, deleteProducto, stockAlerts, formatCurrency: fmt, logAction } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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
    const matchFilter = filter === 'Todos' || p.category === filter;
    return matchSearch && matchFilter;
  });

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); }

  function openEdit(p) {
    setForm({ name: p.name, category: p.category, unit: p.unit, price: p.price, cost: p.cost, stock: p.stock, min_stock: p.min_stock, barcode: p.barcode || '' });
    setEditId(p.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: form.name, category: form.category, unit: form.unit, price: +form.price, cost: +form.cost, stock: +form.stock, min_stock: +form.min_stock, barcode: form.barcode };
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
    if (!confirm('¿Eliminar este producto?')) return;
    try { 
      await deleteProducto(id); 
      await logAction('Eliminar Producto', `Borró el producto: ${name}`, 'Inventario');
    }
    catch (e) { alert('Error eliminando: ' + e.message); }
  }

  return (
    <div className="page-content">
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
        <button className="btn-primary" onClick={openNew} id="btn-agregar-producto">
          <Plus size={15} /> Agregar Producto
        </button>
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
            <option>Todos</option>
            <option>Productos</option>
            <option>Servicios</option>
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
            const isLow = p.category !== 'Servicios' && p.stock < p.min_stock;
            const isService = p.category === 'Servicios';
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
                <td><span className={`category-badge ${isService ? 'servicio' : ''}`}>{p.category}</span></td>
                <td>
                  <p style={{ fontWeight: 600 }}>{fmt(p.price)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Costo: {fmt(p.cost)}</p>
                </td>
                <td>
                  {isService ? <span className="stock-good">∞ servicios</span>
                    : isLow ? <span className="stock-low"><TriangleAlert size={12} /> {p.stock} unidades</span>
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

      {/* Modal */}
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option>Productos</option>
                    <option>Servicios</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unidad</label>
                  <select className="form-select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    <option>Unidad</option>
                    <option>Servicio</option>
                    <option>Kg</option>
                    <option>Lt</option>
                  </select>
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
    </div>
  );
}
