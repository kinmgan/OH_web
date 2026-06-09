import React from 'react';

type Props = {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: '#fff',
        padding: '32px 24px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        fontFamily: 'inherit',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '16px', color: '#333', marginBottom: '28px', fontWeight: 500, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 24px',
              border: '1px solid #ddd',
              background: '#fff',
              color: '#333',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: '#ef5350',
              color: '#fff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e53935'}
            onMouseOut={(e) => e.currentTarget.style.background = '#ef5350'}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
