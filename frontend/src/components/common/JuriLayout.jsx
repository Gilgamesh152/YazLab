import { Outlet } from 'react-router-dom';
import JuriNavbar from './JuriNavbar';
import React from 'react';

export default function JuriLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <JuriNavbar />
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
