import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <div 
        className={`form-select ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
        style={{ 
          cursor: disabled ? 'not-allowed' : 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'var(--bg-input)',
          border: `1px solid ${open ? 'var(--accent-blue)' : 'var(--border)'}`,
          boxShadow: open ? '0 0 0 3px var(--accent-blue-light)' : 'none',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.label : 'Seleccionar...'}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: 'var(--text-muted)', 
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </div>

      {open && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          marginTop: 6, background: 'var(--bg-card)', 
          border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 100,
          maxHeight: 250, overflowY: 'auto',
          padding: 4
        }}>
          {options.map((opt) => {
            const isSelected = String(value) === String(opt.value);
            return (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  padding: '10px 14px', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: isSelected ? 'var(--accent-blue-light)' : 'transparent',
                  color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                  borderRadius: 6,
                  marginBottom: 2,
                  transition: 'background 0.1s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'var(--accent-blue-light)' : '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'var(--accent-blue-light)' : 'transparent'}
              >
                <span style={{ fontWeight: isSelected ? 600 : 400 }}>{opt.label}</span>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
