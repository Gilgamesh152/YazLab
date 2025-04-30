import React from "react";

export default function ApplicationTable({ basvurular }) {
  const durumRengi = {
    Beklemede: 'bg-yellow-100 text-yellow-700',
    Onaylandı: 'bg-green-100 text-green-700',
    Reddedildi: 'bg-red-100 text-red-700',
  };

  return (
    <table className="w-full border text-left shadow">
      <thead className="bg-indigo-100 text-indigo-700">
        <tr>
          <th className="p-2">Unvan</th>
          <th className="p-2">Birim</th>
          <th className="p-2">Başvuru Tarihi</th>
          <th className="p-2">Durum</th>
        </tr>
      </thead>
      <tbody>
        {basvurular.map((b) => (
          <tr key={b.id} className="border-b hover:bg-gray-50">
            <td className="p-2">{b.ilanUnvani}</td>
            <td className="p-2">{b.birim}</td>
            <td className="p-2">{b.tarih}</td>
            <td className="p-2">
              <span className={`px-2 py-1 rounded text-sm font-medium ${durumRengi[b.durum]}`}>
                {b.durum}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
