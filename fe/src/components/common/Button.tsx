import React from 'react';

type ButtonColor = 'white' | 'brown';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  colorTheme?: ButtonColor;
}

export default function Button({ children, colorTheme = 'white', style, ...props }: ButtonProps) {
  const isBrown = colorTheme === 'brown';

  return (
    <button
      {...props}
      style={{
        padding: '12px 24px',
        backgroundColor: isBrown ? '#A57322' : '#fff',
        color: isBrown ? '#fff' : '#333',
        border: `1px solid ${isBrown ? '#A57322' : '#ddd'}`,
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 400,
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        ...style,
      }}
      onMouseOver={(e) => {
        if (isBrown) {
          e.currentTarget.style.backgroundColor = '#8c611d'; // Darker brown on hover
        } else {
          e.currentTarget.style.backgroundColor = '#f5f5f5'; // Light gray on hover
        }
        if (props.onMouseOver) props.onMouseOver(e);
      }}
      onMouseOut={(e) => {
        if (isBrown) {
          e.currentTarget.style.backgroundColor = '#A57322';
        } else {
          e.currentTarget.style.backgroundColor = '#fff';
        }
        if (props.onMouseOut) props.onMouseOut(e);
      }}
    >
      {children}
    </button>
  );
}
