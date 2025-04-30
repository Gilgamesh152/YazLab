import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Notification from './Notification';
import { Bell } from 'lucide-react'; // tailwind ikon paketi (opsiyonel)

export default function AdayNavbar() {
  const navigate = useNavigate();
  const [bildirimAcik, setBildirimAcik] = useState(false);

  const handleLogout = () => {
    alert('Çıkış yapıldı');
    navigate('/login');
  };

  const toggleBildirim = () => setBildirimAcik(!bildirimAcik);

  const linkClass =
    'px-3 py-2 rounded hover:bg-indigo-600 transition text-white';
  const activeClass =
    'bg-white text-indigo-700 font-semibold shadow px-3 py-2 rounded';

  return (
    <nav className="relative bg-indigo-700 text-white px-6 py-3 flex justify-between items-center shadow">
      <div className="font-bold text-lg">Aday Paneli</div>
      <div className="flex items-center space-x-3">
        <NavLink to="/aday/ilanlar" className={({ isActive }) => (isActive ? activeClass : linkClass)}>İlanlar</NavLink>
        <NavLink to="/aday/basvurularim" className={({ isActive }) => (isActive ? activeClass : linkClass)}>Başvurularım</NavLink>
        <NavLink to="/aday/belge-yukle" className={({ isActive }) => (isActive ? activeClass : linkClass)}>Belge Yükleme</NavLink>

        {/* 🔔 Bildirim ikonu */}
        <button onClick={toggleBildirim} className="relative">
          <Bell className="w-5 h-5 text-white hover:text-yellow-300" />
          {/* 🔴 Yeni bildirim göstergesi simülasyonu */}
          <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full"></span>
        </button>

        <button onClick={handleLogout} className="ml-2 bg-red-500 px-3 py-1 rounded hover:bg-red-600">
          Çıkış
        </button>
      </div>

      <Notification open={bildirimAcik} onClose={toggleBildirim} />
    </nav>
  );
}
