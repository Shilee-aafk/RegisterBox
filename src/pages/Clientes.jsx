import { useState } from 'react';
import { Users, Star, TrendingUp, Gift, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';


function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const TAG_COLORS = {
  VIP: { bg: '#ede9fe', color: '#7c3aed' },
  Premium: { bg: '#fce7f3', color: '#be185d' },
  Frecuente: { bg: '#d1fae5', color: '#065f46' },
  Nuevo: { bg: '#fef3c7', color: '#92400e' },
};

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

function Tag({ label }) {
  const style = TAG_COLORS[label] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ background: style.bg, color: style.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, display: 'inline-block' }}>
      {label}
    </span>
  );
}

const ALL_TAGS = ['VIP', 'Premium', 'Frecuente', 'Nuevo'];

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', tags: [] };

export default function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, formatCurrency: fmt } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = clientes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const vipCount = clientes.filter(c => c.tags?.includes('VIP')).length;
  const totalIngresos = clientes.reduce((s, c) => s + (c.total_compras || 0), 0);
  const avgPuntos = clientes.length ? Math.round(clientes.reduce((s, c) => s + (c.puntos || 0), 0) / clientes.length) : 0;

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); }

  function openEdit(c, e) {
    e.stopPropagation();
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '', tags: [...(c.tags || [])] });
    setEditId(c.id);
    setShowModal(true);
  }

  function toggleTag(tag) {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const r = await updateCliente(editId, form);
        if (selected?.id === editId) setSelected(r);
      } else {
        await addCliente({ ...form, puntos: 0, total_compras: 0, num_compras: 0 });
      }
      setShowModal(false);
    } catch (e) { alert('Error: ' + e.message); }
    setSaving(false);
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await deleteCliente(id);
      if (selected?.id === id) setSelected(null);
    } catch (e) { alert('Error: ' + e.message); }
  }

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Total Clientes</p>
            <p className="stat-card-value">{clientes.length}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#eff6ff' }}>
            <Users size={20} color="#3b82f6" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Clientes VIP</p>
            <p className="stat-card-value">{vipCount}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#f5f3ff' }}>
            <Star size={20} color="#8b5cf6" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Ingresos Totales</p>
            <p className="stat-card-value" style={{ fontSize: 20 }}>{fmt(totalIngresos)}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#ecfdf5' }}>
            <TrendingUp size={20} color="#10b981" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-left">
            <p className="stat-card-label">Puntos Promedio</p>
            <p className="stat-card-value">{avgPuntos}</p>
          </div>
          <div className="stat-card-icon" style={{ background: '#fff7ed' }}>
            <Gift size={20} color="#f97316" />
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* Left: Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Clientes</h2>
            <button className="btn-primary" onClick={openNew} id="btn-agregar-cliente">
              <Plus size={14} /> Agregar Cliente
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 20px' }}>
            <div className="search-input-wrap">
              <Search size={14} color="var(--text-muted)" />
              <input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} id="cli-search" />
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, padding: '8px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            <span>Cliente</span>
            <span>Contacto</span>
            <span>Compras</span>
            <span>Acciones</span>
          </div>

          {/* Rows */}
          {filtered.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f9fafb', cursor: 'pointer', background: selected?.id === c.id ? '#eff6ff' : 'transparent', transition: 'background .15s' }}
            >
              {/* Cliente */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                    {(c.tags || []).map(t => <Tag key={t} label={t} />)}
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.email}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone}</p>
              </div>

              {/* Compras */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{fmt(c.total_compras || 0)}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.num_compras || 0} compras</p>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="action-btn edit" onClick={e => openEdit(c, e)} title="Editar">
                  <Pencil size={14} />
                </button>
                <button className="action-btn delete" onClick={e => handleDelete(c.id, e)} title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detail panel */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: 20, height: 'fit-content' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Detalle del Cliente</p>
          {!selected ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 10px', display: 'block', opacity: .25 }} />
              <p style={{ fontSize: 13 }}>Selecciona un cliente<br />para ver sus detalles</p>
            </div>
          ) : (
            <div>
              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: AVATAR_COLORS[filtered.findIndex(c => c.id === selected.id) % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, margin: '0 auto 8px' }}>
                  {initials(selected.name)}
                </div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{selected.name}</p>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                  {selected.tags.map(t => <Tag key={t} label={t} />)}
                </div>
              </div>

              {/* Info */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>✉️ {selected.email}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📞 {selected.phone}</p>
                {selected.address && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {selected.address}</p>}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>{selected.num_compras || 0}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Compras</p>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>{fmt(selected.total_compras || 0)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total gastado</p>
                </div>
              </div>

              {/* Puntos */}
              <div style={{ marginTop: 12, background: '#f5f3ff', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>⭐ Puntos</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>{selected.puntos}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input className="form-input" placeholder="Nombre del cliente" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus id="cli-modal-nombre" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="cliente@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" placeholder="+57 300 123 4567" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección (opcional)</label>
                <input className="form-input" placeholder="Calle 123 #45-67" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Etiquetas</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ALL_TAGS.map(tag => {
                    const active = form.tags.includes(tag);
                    const style = TAG_COLORS[tag];
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${active ? style.color : '#e5e7eb'}`, background: active ? style.bg : '#fff', color: active ? style.color : 'var(--text-secondary)', transition: 'all .15s' }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving} id="cli-modal-agregar">{saving ? 'Guardando…' : editId ? 'Guardar' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
