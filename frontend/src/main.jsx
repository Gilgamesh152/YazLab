import React from 'react';
import { createRoot } from 'react-dom/client'; // 🔄 Yeni API
import { Helmet } from 'react-helmet';

import '@/index.css';
import App from '@/App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Helmet
      defaultTitle='Vite React Tailwind Starter'
      titleTemplate='%s | Vite React Tailwind Starter'
    >
      <meta charSet='utf-8' />
      <html lang='id' amp />
    </Helmet>
    <App />
  </React.StrictMode>
);
