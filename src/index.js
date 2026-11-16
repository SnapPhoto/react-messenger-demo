import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

axios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && config.url) {
    const request_url = new URL(config.url, window.location.href);
    if (request_url.hostname === 'localhost' || request_url.hostname === '127.0.0.1') {
      request_url.hostname = window.location.hostname;
      config.url = request_url.toString();
    }
  }
  return config;
});

const main = ReactDOM.createRoot(document.getElementById('main'));
main.render(
  <App />
);
reportWebVitals();
