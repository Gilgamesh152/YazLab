import React from "react";
import { NavLink, useNavigate } from 'react-router-dom';

export default function JuriNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    alert('Çıkış yapıldı');
    navigate('/login');
  };

  const linkClass =
    'px-3 py-2 rounded hover:bg-indigo-600 transition text-white';
  const activeClass =
    'bg-white text-indigo-700 font-semibold shadow px-3 py-2 rounded';

  return (
    <nav className="bg-indigo-700 text-white px-6 py-3 flex justify-between items-center shadow">
      <div className="font-bold text-lg">Jüri Paneli</div>
      <div className="flex items-center space-x-3">
        <NavLink to="/akademisyen/dashboard" className={({ isActive }) => (isActive ? activeClass : linkClass)}>
          Başvurular
        </NavLink>

        <button
          onClick={handleLogout}
          className="ml-2 bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Çıkış
        </button>
      </div>
    </nav>
  );
}
