import React from 'react';

const overlayStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '10rem',
//   background: 'rgba(255,255,255,0.7)', // Optional: semi-transparent background
  zIndex: 9999,
};

const loaderStyle: React.CSSProperties = {
  width: '50px',
  aspectRatio: '1',
  borderRadius: '50%',
  border: '8px solid',
  borderColor: '#1a3aa7 #0000',
  animation: 'l1 1s infinite',
};

const Loader: React.FC = () => (
  <div style={overlayStyle}>
    <div className="loader" style={loaderStyle}>
      <style>
        {`
        @keyframes l1 { to { transform: rotate(.5turn) } }
        `}
      </style>
    </div>
  </div>
);

export default Loader;