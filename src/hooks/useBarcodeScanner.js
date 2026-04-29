import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook: useBarcodeScanner
 * 
 * Escucha globalmente los eventos de teclado y detecta cuándo un lector
 * de códigos de barras (que actúa como teclado rápido + Enter) ha enviado
 * un código, diferenciándolo de un humano tecleando normalmente.
 * 
 * @param {function} onScan - Callback que recibe el código escaneado (string).
 */
export default function useBarcodeScanner(onScan) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  // Memorizamos el callback para que el listener siempre use la versión más reciente
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    function handleKeyDown(e) {
      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;

      // Si pasaron más de 30ms desde la última tecla, es velocidad humana:
      // descartamos lo acumulado y empezamos un buffer nuevo.
      if (elapsed > 30) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        // Solo disparamos si el buffer tiene al menos 4 caracteres
        // para evitar falsos positivos con Enters sueltos.
        if (bufferRef.current.length > 3) {
          e.preventDefault();
          onScanRef.current(bufferRef.current);
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        // Solo caracteres imprimibles (letras, números, guiones, etc.)
        bufferRef.current += e.key;
      }

      lastKeyTimeRef.current = now;
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
