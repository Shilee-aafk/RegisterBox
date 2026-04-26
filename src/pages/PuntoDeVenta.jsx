import { useState } from 'react';
import { Search, ShoppingCart, Minus, Plus, Trash2, User, CreditCard, Banknote, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';


const ALL_PAYMENT_METHODS = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
];

export default function PuntoDeVenta() {
  const { productos, clientes, processSale, config, formatCurrency: fmt, logAction } = useApp();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('tarjeta');
  const [discount, setDiscount] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const IVA_RATE = config?.regional?.iva ? (Number(config.regional.iva) / 100) : 0.19;
  const activePaymentMethods = ALL_PAYMENT_METHODS.filter(pm => config?.payments?.[pm.key] !== false);

  const filteredProducts = productos.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  function addToCart(product) {
    // Check if product item stock allows it
    if (product.category !== 'Servicios' && product.stock <= 0) {
      alert('Sin stock disponible para este producto.');
      return;
    }
    setCart(c => {
      const existing = c.find(i => i.id === product.id);
      if (existing) {
        if (product.category !== 'Servicios' && existing.qty >= product.stock) {
          alert('No hay suficiente stock.');
          return c;
        }
        return c.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...c, { ...product, qty: 1 }];
    });
  }

  function updateQty(id, delta) {
    setCart(c => c
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  }

  function removeItem(id) { setCart(c => c.filter(i => i.id !== id)); }

  function clearCart() { setCart([]); setDiscount(0); setSelectedClientId(''); }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const iva = Math.round(subtotal * IVA_RATE);
  const discountAmt = +discount || 0;
  const total = subtotal + iva - discountAmt;

  const selectedClient = clientes.find(c => c.id === selectedClientId);

  async function handleCobrar() {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      await processSale({
        cart,
        total,
        payMethod,
        clientId: selectedClientId || null,
        clientName: selectedClient?.name || null,
      });
      await logAction('Completar Venta', `Total: ${fmt(total)} - Método: ${payMethod} - Items: ${cart.length}`, 'Punto de Venta');
      setSuccess(true);
      clearCart();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert('Error procesando venta: ' + e.message);
    }
    setProcessing(false);
  }

  return (
    <div className="page-content" style={{ padding: '20px 24px' }}>
      {success && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#10b981', color: '#fff', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(16,185,129,.4)', zIndex: 9999, fontSize: 15, fontWeight: 600 }}>
          <CheckCircle size={20} /> ¡Venta procesada exitosamente!
        </div>
      )}

      <div className="pos-layout">
        {/* Products Panel */}
        <div className="pos-products">
          <div className="pos-search">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Buscar por nombre o código de barras..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="pos-search"
            />
          </div>

          <div className="pos-products-grid">
            {filteredProducts.map(p => {
              const isLow = p.category !== 'Servicios' && p.stock < p.min_stock;
              const outOfStock = p.category !== 'Servicios' && p.stock <= 0;
              return (
                <div
                  key={p.id}
                  className={`pos-product-card ${isLow ? 'low-stock' : ''}`}
                  onClick={() => !outOfStock && addToCart(p)}
                  style={{ opacity: outOfStock ? 0.45 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
                  id={`pos-product-${p.id}`}
                >
                  {!outOfStock && p.category !== 'Servicios' && (
                    <span className="pos-stock-badge" style={{ background: isLow ? '#ef4444' : '#10b981' }}>{p.stock}</span>
                  )}
                  {outOfStock && <span className="pos-stock-badge" style={{ background: '#9ca3af' }}>Sin stock</span>}
                  <div className="pos-product-img"><ShoppingCart size={28} /></div>
                  <p className="pos-product-name">{p.name}</p>
                  <p className="pos-product-cat">{p.category}</p>
                  <p className="pos-product-price">{fmt(p.price)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="cart-panel">
          <div className="cart-header">
            <h2><ShoppingCart size={16} /> Carrito</h2>
            <button className="cart-clear-btn" onClick={clearCart}>Vaciar</button>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingCart size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: .3 }} />
                Agrega productos al carrito
              </div>
            ) : (
              cart.map(item => (
                <div className="cart-item" key={item.id}>
                  <div style={{ flex: 1 }}>
                    <p className="cart-item-name">{item.name.length > 14 ? item.name.slice(0, 14) + '…' : item.name}</p>
                    <p className="cart-item-price-unit">{fmt(item.price)} x {item.qty}</p>
                  </div>
                  <div className="cart-qty-controls">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <button className="cart-remove" onClick={() => removeItem(item.id)}><Trash2 size={13} /></button>
                  <span className="cart-item-total">{fmt(item.price * item.qty)}</span>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            {/* Customer selector — real clients from Supabase */}
            <div className="cart-customer">
              <User size={14} color="var(--text-muted)" />
              <select
                className="cart-customer-select"
                id="pos-cliente"
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
              >
                <option value="">Cliente General</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Totals */}
            <div className="cart-totals">
              <div className="cart-total-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="cart-total-row"><span>IVA ({config?.regional?.iva || 19}%)</span><span>{fmt(iva)}</span></div>
              <div className="cart-total-row">
                <span>Descuento</span>
                <input className="discount-input" type="number" value={discount} onChange={e => setDiscount(e.target.value)} min={0} id="pos-descuento" />
              </div>
              <div className="cart-total-row grand"><span>Total</span><span>{fmt(total)}</span></div>
            </div>

            {/* Payment methods */}
            <div className="payment-methods">
              {activePaymentMethods.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`payment-method-btn ${payMethod === key ? 'active' : ''}`}
                  onClick={() => setPayMethod(key)}
                  id={`pos-pay-${key}`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {/* Charge button */}
            <button
              className="btn-cobrar"
              onClick={handleCobrar}
              disabled={cart.length === 0 || processing}
              id="btn-cobrar"
              style={{ opacity: cart.length === 0 || processing ? 0.6 : 1 }}
            >
              {processing ? 'Procesando…' : `Cobrar ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
