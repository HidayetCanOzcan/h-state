import React from 'react';
import ReactDOM from 'react-dom/client';
import BasicExample from './BasicExample';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BasicExample />
  </React.StrictMode>
);
