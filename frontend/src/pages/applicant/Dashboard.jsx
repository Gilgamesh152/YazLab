// src/pages/applicant/Dashboard.js
import React from 'react';
import { Link } from "react-router-dom";

export default function Dashboard() {
  const toplamBasvuru = 3;
  const onayli = 1;
  const beklemede = 2;

  return (
    <>
      <h1 className="text-2xl font-bold text-indigo-700 mb-6">Hoş Geldiniz!</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded p-4 border-l-4 border-indigo-500">
          <h2 className="text-xl font-semibold text-gray-800">Toplam Başvuru</h2>
          <p className="text-3xl text-indigo-600 mt-2">{toplamBasvuru}</p>
        </div>
        <div className="bg-white shadow rounded p-4 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-800">Onaylanan</h2>
          <p className="text-3xl text-green-600 mt-2">{onayli}</p>
        </div>
        <div className="bg-white shadow rounded p-4 border-l-4 border-yellow-500">
          <h2 className="text-xl font-semibold text-gray-800">Beklemede</h2>
          <p className="text-3xl text-yellow-600 mt-2">{beklemede}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2 text-indigo-600">Hızlı Erişim</h2>
      <div className="flex flex-wrap gap-4">
        <Link to="/aday/ilanlar" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">İlanlara Göz At</Link>
        <Link to="/aday/basvurularim" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Başvurularım</Link>
        <Link to="/aday/belge-yukle" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Belge Yükle</Link>
        {/* <Link to="/aday/durum" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Bildirimler</Link> */}
      </div>
    </>
  );
}

