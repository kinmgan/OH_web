import React, { useState, useEffect } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
  onRemove?: () => void;
  max?: number;
};

export default function QuantityInput({ value, onChange, onRemove, max = 9999 }: Props) {
  const [localValue, setLocalValue] = useState(value < 10 ? `0${value}` : value.toString());

  useEffect(() => {
    setLocalValue(value < 10 ? `0${value}` : value.toString());
  }, [value]);

  const handleDecrease = () => {
    if (value > 1) {
      onChange(value - 1);
    } else if (value === 1 && onRemove) {
      onRemove();
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (/^\d*$/.test(text)) {
      setLocalValue(text);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed === 0) {
      if (parsed === 0 && onRemove) {
        onRemove();
        setLocalValue(value < 10 ? `0${value}` : value.toString());
      } else {
        onChange(1);
        setLocalValue('01');
      }
    } else if (parsed > max) {
      onChange(max);
      setLocalValue(max < 10 ? `0${max}` : max.toString());
    } else {
      onChange(parsed);
      setLocalValue(parsed < 10 ? `0${parsed}` : parsed.toString());
    }
  };

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'stretch', 
      border: '1px solid #e0e0e0', 
      borderRadius: '4px',
      overflow: 'hidden',
      height: '36px'
    }}>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          width: '60px',
          textAlign: 'center',
          border: 'none',
          outline: 'none',
          fontWeight: 500,
          fontFamily: 'inherit',
          fontSize: '14px'
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e0e0e0' }}>
        <button
          onClick={handleIncrease}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #e0e0e0',
            cursor: 'pointer',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 5L5 1L9 5" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={handleDecrease}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
