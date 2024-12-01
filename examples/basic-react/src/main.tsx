import React from 'react';
import ReactDOM from 'react-dom/client';
import BasicExample from './BasicExample';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BasicExample />
  </React.StrictMode>
);
