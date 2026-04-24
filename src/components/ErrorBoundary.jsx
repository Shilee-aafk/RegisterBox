import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          width: '100vw', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#f9fafb',
          textAlign: 'center',
          padding: 20
        }}>
          <div style={{ 
            background: '#fee2e2', 
            color: '#ef4444', 
            padding: 20, 
            borderRadius: '50%', 
            marginBottom: 20 
          }}>
            <AlertTriangle size={48} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#1a1d27' }}>
            ¡Ups! Algo no salió como esperábamos
          </h1>
          <p style={{ color: '#6b7280', maxWidth: 450, marginBottom: 30, lineHeight: 1.6 }}>
            La aplicación encontró un error inesperado al intentar mostrar esta pantalla. 
            No te preocupes, tus datos están a salvo.
          </p>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                background: 'var(--accent-blue, #0d9488)', 
                color: '#fff', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: 12, 
                fontWeight: 700, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <RefreshCw size={18} /> Recargar Aplicación
            </button>
            
            <button 
              onClick={() => this.setState({ hasError: false, error: null })} 
              style={{ 
                background: '#fff', 
                color: '#4b5563', 
                border: '1px solid #e5e7eb', 
                padding: '12px 24px', 
                borderRadius: 12, 
                fontWeight: 700, 
                cursor: 'pointer'
              }}
            >
              Intentar de nuevo
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: 40, textAlign: 'left', background: '#f3f4f6', padding: 16, borderRadius: 8, fontSize: 12, maxWidth: '80%', overflowX: 'auto' }}>
              <p style={{ fontWeight: 700, marginBottom: 8, color: '#ef4444' }}>Detalles del error:</p>
              <code>{this.state.error?.toString()}</code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
