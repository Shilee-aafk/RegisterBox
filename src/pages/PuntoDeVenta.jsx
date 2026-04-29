import { useState, useCallback } from 'react';
import { Search, ShoppingCart, Minus, Plus, Trash2, User, UserCheck, CreditCard, Banknote, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import useBarcodeScanner from '../hooks/useBarcodeScanner';
import { localDb } from '../lib/localDb';
import { supabase } from '../lib/supabase';


const ALL_PAYMENT_METHODS = [
  { key: 'efectivo', label: 'Efectivo', icon: Banknote },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
];

export default function PuntoDeVenta() {
  const { productos, categorias, clientes, processSale, config, formatCurrency: fmt, logAction } = useApp();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('tarjeta');
  const [rutInput, setRutInput] = useState('');
  const [clienteActual, setClienteActual] = useState(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scanNotif, setScanNotif] = useState(null);

  const IVA_RATE = config?.regional?.iva ? (Number(config.regional.iva) / 100) : 0.19;
  const activePaymentMethods = ALL_PAYMENT_METHODS.filter(pm => config?.payments?.[pm.key] !== false);

  /* ---- Barcode Scanner Integration ---- */
  const handleScan = useCallback(async (code) => {
    // Ignorar escaneos si el usuario está escribiendo en un input
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    const trimmed = code.trim();
    if (!trimmed) return;

    try {
      // 1. Buscar primero en Dexie (offline-first)
      let product = await localDb.productos
        .filter(p => p.barcode === trimmed || p.sku === trimmed)
        .first();

      // 2. Si no está en local, intentar en Supabase
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
        addToCart(product);
        setScanNotif({ type: 'ok', text: `✓ ${product.name}` });
      } else {
        setScanNotif({ type: 'error', text: `Producto no encontrado: ${trimmed}` });
      }
    } catch (err) {
      console.error('Error en escaneo:', err);
      setScanNotif({ type: 'error', text: 'Error buscando producto' });
    }

    // Auto-ocultar notificación
    setTimeout(() => setScanNotif(null), 2500);
  }, []);

  useBarcodeScanner(handleScan);

  function formatRUT(rut) {
    if (!rut) return '';
    let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length === 0) return '';
    if (clean.length <= 1) return clean;
    
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    
    let formattedBody = '';
    for (let i = body.length - 1, j = 1; i >= 0; i--, j++) {
      formattedBody = body.charAt(i) + formattedBody;
      if (j % 3 === 0 && i !== 0) formattedBody = '.' + formattedBody;
    }
    return `${formattedBody}-${dv}`;
  }

  function handleRutChange(e) {
    setRutInput(formatRUT(e.target.value));
  }

  const buscarCliente = async (rutAFormatear) => {
    const cleanRut = rutAFormatear.replace(/[^0-9kK]/g, '').toUpperCase();
    if (!cleanRut) {
      setClienteActual(null);
      return;
    }
    
    setBuscandoCliente(true);
    const formattedRut = formatRUT(cleanRut);
    
    try {
      let cliente = await localDb.clientes.filter(c => c.rut && c.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanRut).first();
      
      if (!cliente) {
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('rut', formattedRut)
          .maybeSingle();
        cliente = data;
      }
      
      if (cliente) {
        setClienteActual(cliente);
        setRutInput(cliente.rut || formattedRut);
      } else {
        setClienteActual({ rut: formattedRut, name: 'Cliente Nuevo' });
      }
    } catch (err) {
      console.error("Error buscando cliente:", err);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleRutKeyDown = (e) => {
    if (e.key === 'Enter') {
      buscarCliente(rutInput);
    }
  };

  const filteredProducts = productos.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  function addToCart(product) {
    // Check if product item stock allows it
    if (product.stock <= 0) {
      alert('Sin stock disponible para este producto.');
      return;
    }
    setCart(c => {
      const existing = c.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
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

  function clearCart() { setCart([]); setRutInput(''); setClienteActual(null); }

  const calcularSubtotalFila = useCallback((item, qty, cliente, categoriasActivas) => {
    let qtyACobrar = qty;
    if (item.tipo_promocion === '2x1') {
      qtyACobrar = Math.floor(qty / 2) * 1 + (qty % 2);
    } else if (item.tipo_promocion === '3x2') {
      qtyACobrar = Math.floor(qty / 3) * 2 + (qty % 3);
    } else if (item.tipo_promocion === '4x3') {
      qtyACobrar = Math.floor(qty / 4) * 3 + (qty % 4);
    }

    const precioBase = item.price;
    const descGeneral = item.descuento_general || 0;
    
    let descCategoria = 0;
    if (item.categoria_id) {
      const cat = categoriasActivas.find(c => String(c.id) === String(item.categoria_id));
      if (cat && cat.descuento_base) {
        descCategoria = cat.descuento_base;
      }
    }

    let descuentoPorcentual = Math.max(descGeneral, descCategoria);

    if (cliente && cliente.id && item.descuento_cliente_frecuente > 0) {
      descuentoPorcentual += item.descuento_cliente_frecuente;
    }

    descuentoPorcentual = Math.min(descuentoPorcentual, 100);

    const precioUnitarioConDescuento = precioBase * (1 - descuentoPorcentual / 100);
    const subtotal = precioUnitarioConDescuento * qtyACobrar;
    const subtotalOriginal = precioBase * qty;
    
    return {
      qtyACobrar,
      precioUnitarioConDescuento,
      descuentoAplicado: descuentoPorcentual > 0,
      promocionAplicada: qtyACobrar < qty,
      subtotal,
      subtotalOriginal
    };
  }, []);

  const subtotal = cart.reduce((s, i) => {
    const calc = calcularSubtotalFila(i, i.qty, clienteActual, categorias);
    return s + calc.subtotal;
  }, 0);
  const iva = Math.round(subtotal * IVA_RATE);
  const total = subtotal + iva;

  async function handleCobrar() {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      await processSale({
        cart,
        total,
        payMethod,
        clientId: clienteActual?.id || null,
        clientName: clienteActual?.name || null,
        clientRut: clienteActual?.rut || null,
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

      {scanNotif && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          background: scanNotif.type === 'ok' ? '#10b981' : '#ef4444',
          color: '#fff', borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `0 4px 20px ${scanNotif.type === 'ok' ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)'}`,
          zIndex: 9999, fontSize: 15, fontWeight: 600,
          animation: 'fadeIn .2s ease'
        }}>
          {scanNotif.text}
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
              const isLow = p.stock < p.min_stock;
              const outOfStock = p.stock <= 0;
              return (
                <div
                  key={p.id}
                  className={`pos-product-card ${isLow ? 'low-stock' : ''}`}
                  onClick={() => !outOfStock && addToCart(p)}
                  style={{ opacity: outOfStock ? 0.45 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
                  id={`pos-product-${p.id}`}
                >
                  {!outOfStock && (
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
              cart.map(item => {
                const calc = calcularSubtotalFila(item, item.qty, clienteActual, categorias);
                const hasDiscount = calc.descuentoAplicado || calc.promocionAplicada;
                
                return (
                  <div className="cart-item" key={item.id}>
                    <div style={{ flex: 1 }}>
                      <p className="cart-item-name">{item.name.length > 14 ? item.name.slice(0, 14) + '…' : item.name}</p>
                      {hasDiscount ? (
                        <p className="cart-item-price-unit" style={{ fontSize: 11 }}>
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: 4 }}>{fmt(item.price)}</span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{fmt(calc.precioUnitarioConDescuento)}</span> x {item.qty}
                          {calc.promocionAplicada && <span style={{ color: '#8b5cf6', marginLeft: 4, fontWeight: 600 }}>({item.tipo_promocion})</span>}
                        </p>
                      ) : (
                        <p className="cart-item-price-unit">{fmt(item.price)} x {item.qty}</p>
                      )}
                    </div>
                    <div className="cart-qty-controls">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <button className="cart-remove" onClick={() => removeItem(item.id)}><Trash2 size={13} /></button>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: 10, minWidth: 60 }}>
                      {hasDiscount && (
                        <span style={{ fontSize: 10, textDecoration: 'line-through', color: '#9ca3af' }}>{fmt(calc.subtotalOriginal)}</span>
                      )}
                      <span className="cart-item-total" style={{ color: hasDiscount ? '#10b981' : 'inherit' }}>{fmt(calc.subtotal)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="cart-footer">
            {/* Customer selector with RUT */}
            <div className="cart-customer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0, padding: 0, background: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px', border: '2px solid var(--primary-color)', borderRadius: '8px', padding: '10px 14px', background: 'var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                 {clienteActual && clienteActual.id ? (
                   <UserCheck size={18} color="#10b981" />
                 ) : (
                   <User size={18} color="var(--primary-color)" />
                 )}
                 <input 
                   type="text" 
                   placeholder="RUT Cliente (Opcional)" 
                   value={rutInput}
                   onChange={handleRutChange}
                   onBlur={() => buscarCliente(rutInput)}
                   onKeyDown={handleRutKeyDown}
                   style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}
                 />
                 {buscandoCliente && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>...</span>}
              </div>
              {clienteActual && clienteActual.id && (
                 <div style={{ fontSize: '11px', color: '#10b981', marginTop: '6px', marginLeft: '4px', fontWeight: 500 }}>
                    Cliente Frecuente: {clienteActual.name}
                 </div>
              )}
              {clienteActual && !clienteActual.id && (
                 <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', marginLeft: '4px' }}>
                    Se registrará bajo el RUT: {clienteActual.rut}
                 </div>
              )}
            </div>

            {/* Totals */}
            <div className="cart-totals">
              <div className="cart-total-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="cart-total-row"><span>IVA ({config?.regional?.iva || 19}%)</span><span>{fmt(iva)}</span></div>
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
