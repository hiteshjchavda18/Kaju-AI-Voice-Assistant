import React from 'react';
import cashewImg from '../assets/cashew.png';

export function CashewMoonIcon({ size = 26, className = '', style = {} }) {
  return (
    <img
      src={cashewImg}
      alt="Kaju Cashew"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.55))',
        transform: 'rotate(-5deg)',
        transition: 'transform 0.3s ease',
        cursor: 'default',
        ...style
      }}
    />
  );
}
