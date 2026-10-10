import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import AnimatedUI from './AnimatedUI';
import './styles.css';
import './knockout.css';
import './premier.css';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnimatedUI />
    <App />
  </React.StrictMode>,
);
