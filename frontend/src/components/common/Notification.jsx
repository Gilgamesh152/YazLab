import React from "react";

export default function Notification({ open, onClose }) {
  const bildirimler = [
    { id: 1, mesaj: 'Başvurunuz onaylandı.', tarih: '2025-04-25' },
    { id: 2, mesaj: 'Eksik belge bildirimi yapıldı.', tarih: '2025-04-24' },
    { id: 3, mesaj: 'Yeni ilan yayınlandı: Doçent - Bilgisayar Müh.', tarih: '2025-04-22' },
  ];

  if (!open) return null;

  return (
    <div className="absolute top-16 right-6 w-72 bg-white border rounded shadow-lg z-50">
      <div className="px-4 py-2 border-b flex justify-between items-center">
        <h2 className="font-semibold text-indigo-700">Bildirimler</h2>
        <button onClick={onClose} className="text-sm text-gray-500 hover:underline">Kapat</button>
      </div>
      <ul className="divide-y">
        {bildirimler.map((b) => (
          <li key={b.id} className="px-4 py-2 text-sm hover:bg-gray-50">
            <p className="text-gray-800">{b.mesaj}</p>
            <p className="text-xs text-gray-400">{b.tarih}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
