import { useState } from 'react';
import { MapPin, Plus, Store, Navigation, Shield, Info, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function Locales() {
  const { locales, addLocal, updateLocal, deleteLocal, isGlobalAdmin, formatCurrency: fmt, confirmAction, logAction } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nombre: '', direccion: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!isGlobalAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Shield size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.3 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)' }}>Solo los administradores pueden gestionar las sucursales.</p>
      </div>
    );
  }

  function openNew() {
    setForm({ nombre: '', direccion: '' });
    setEditId(null);
    setShowAdd(true);
  }

  function openEdit(loc) {
    setForm({ nombre: loc.nombre, direccion: loc.direccion || '' });
    setEditId(loc.id);
    setShowAdd(true);
  }

  async function handleDelete(id, nombre) {
    confirmAction(
      'Eliminar Sucursal',
      `¿Estás seguro que deseas eliminar la sucursal "${nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await deleteLocal(id);
          await logAction('Eliminar Sucursal', `Borró la sucursal: ${nombre}`, 'Configuración');
          toast.success('Sucursal eliminada correctamente');
        } catch (err) {
          toast.error('Error al eliminar: ' + err.message);
        }
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    
    setSaving(true);
    try {
      if (editId) {
        await updateLocal(editId, form);
        await logAction('Editar Sucursal', `Actualizó sucursal: ${form.nombre}`, 'Configuración');
        toast.success('Sucursal actualizada correctamente');
      } else {
        await addLocal(form);
        await logAction('Agregar Sucursal', `Creó la sucursal: ${form.nombre}`, 'Configuración');
        toast.success('Sucursal agregada correctamente');
      }
      setForm({ nombre: '', direccion: '' });
      setShowAdd(false);
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-content fade-in">
      <div className="inventory-toolbar">
        <div>
          <h2>Sucursales</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Gestiona los locales y puntos de venta de tu empresa</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={15} /> Nueva Sucursal
        </button>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Dirección</th>
              <th>Creación</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locales?.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  Aún no tienes sucursales adicionales registradas.
                </td>
              </tr>
            ) : (
              locales?.map(loc => (
                <tr key={loc.id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-icon">
                        <Store size={18} />
                      </div>
                      <div>
                        <div className="product-name">{loc.nombre}</div>
                        <div className="product-barcode">ID: {loc.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <Navigation size={14} /> 
                      <span style={{ fontSize: 13 }}>{loc.direccion || 'Sin dirección registrada'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(loc.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <span className="category-badge">Activo</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="action-btn" onClick={() => openEdit(loc)} title="Editar Sucursal">
                      <Pencil size={15} color="var(--text-secondary)" />
                    </button>
                    <button className="action-btn" onClick={() => handleDelete(loc.id, loc.nombre)} title="Eliminar Sucursal" style={{ marginLeft: 6 }}>
                      <Trash2 size={15} color="var(--accent-red)" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Agregar */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>{editId ? 'Editar Sucursal' : 'Registrar Nueva Sucursal'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ background: '#eff6ff', padding: 12, borderRadius: 10, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Info size={18} color="var(--accent-blue)" />
                  <p style={{ fontSize: 12, color: '#1e40af' }}>Cada sucursal tendrá su propio inventario, empleados y citas independientes.</p>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nombre de la Sucursal</label>
                  <input 
                    className="form-input" 
                    placeholder="Ej: Sucursal Norte, Local Centro..." 
                    value={form.nombre}
                    onChange={e => setForm({...form, nombre: e.target.value})}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección Física</label>
                  <input 
                    className="form-input" 
                    placeholder="Calle, Número, Ciudad..." 
                    value={form.direccion}
                    onChange={e => setForm({...form, direccion: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editId ? 'Guardar Cambios' : 'Crear Sucursal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
