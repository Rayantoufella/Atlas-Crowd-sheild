// Form atoms — TextField, NumberField, Select, Textarea, Toggle, Slider.
// All accept `error` boolean to render red border + shake animation.
import React from 'react';

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5,
  letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)',
  marginBottom: 6,
};

const inputStyle = (error) => ({
  width: '100%',
  background: 'var(--bg-2)',
  color: 'var(--fg-0)',
  border: `1px solid ${error ? 'var(--red)' : 'var(--border-strong)'}`,
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13.5,
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});

export function Field({ label, hint, error, children, span = 1 }) {
  return (
    <div className={error ? 'shake' : ''} style={{ gridColumn: `span ${span}` }}>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
      {hint && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--fg-3)' }}>{hint}</div>}
      {error && typeof error === 'string' && (
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--red-2)' }}>{error}</div>
      )}
    </div>
  );
}

export function TextField({ label, value, onChange, error, placeholder, type = 'text', readOnly, hint, span }) {
  return (
    <Field label={label} hint={hint} error={error} span={span}>
      <input
        type={type}
        value={value ?? ''}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ ...inputStyle(error), opacity: readOnly ? 0.7 : 1 }}
      />
    </Field>
  );
}

export function NumberField({ label, value, onChange, error, min, max, step, readOnly, hint, span }) {
  return (
    <Field label={label} hint={hint} error={error} span={span}>
      <input
        type="number"
        value={value ?? ''}
        readOnly={readOnly}
        min={min} max={max} step={step}
        onChange={(e) => onChange?.(e.target.value === '' ? '' : Number(e.target.value))}
        style={{ ...inputStyle(error), opacity: readOnly ? 0.7 : 1, fontFamily: 'var(--font-mono)' }}
      />
    </Field>
  );
}

export function SelectField({ label, value, onChange, error, options, placeholder, hint, span }) {
  return (
    <Field label={label} hint={hint} error={error} span={span}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ ...inputStyle(error), appearance: 'none', backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='none' stroke='%238993a6' stroke-width='2' d='M1 1l5 5 5-5'/></svg>\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 32,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </Field>
  );
}

export function TextArea({ label, value, onChange, error, placeholder, rows = 4, hint, span }) {
  return (
    <Field label={label} hint={hint} error={error} span={span}>
      <textarea
        value={value ?? ''}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ ...inputStyle(error), resize: 'vertical', fontFamily: 'var(--font-ui)' }}
      />
    </Field>
  );
}

export function Toggle({ label, value, onChange, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        {label && <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>}
        {hint && <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange?.(!value)}
        style={{
          width: 44, height: 24, borderRadius: 99,
          border: '1px solid var(--border-strong)',
          background: value ? 'var(--accent)' : 'var(--bg-3)',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          flex: 'none', padding: 0,
        }}
        aria-pressed={value}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 22 : 2,
          width: 18, height: 18, borderRadius: '50%',
          background: 'white', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '', hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent-2)' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        style={{
          width: '100%', height: 6, appearance: 'none',
          background: `linear-gradient(90deg, var(--accent) ${pct}%, var(--bg-3) ${pct}%)`,
          borderRadius: 99, outline: 'none',
        }}
      />
      {hint && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--fg-3)' }}>{hint}</div>}
    </div>
  );
}

// Grid helper for forms
export function FormGrid({ children, cols = 2, gap = 14 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {children}
    </div>
  );
}
