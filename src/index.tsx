import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/game.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Dokümana font önbelleğinin yüklenmesi için link ekle
const fontLink = document.createElement('link');
fontLink.rel = 'preconnect';
fontLink.href = 'https://fonts.googleapis.com';
document.head.appendChild(fontLink);

const fontLink2 = document.createElement('link');
fontLink2.rel = 'preconnect';
fontLink2.href = 'https://fonts.gstatic.com';
fontLink2.crossOrigin = '';
document.head.appendChild(fontLink2);

const fontLink3 = document.createElement('link');
fontLink3.rel = 'stylesheet';
fontLink3.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap';
document.head.appendChild(fontLink3);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
