import AdayNavbar from './AdayNavbar';
import { Outlet } from 'react-router-dom';
import React from 'react';

export default function AdayLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdayNavbar />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
