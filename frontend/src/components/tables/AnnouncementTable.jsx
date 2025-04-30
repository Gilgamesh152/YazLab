import React from "react";

export default function AnnouncementTable({ ilanlar, onBasvur }) {
  return (
    <table className="w-full border text-left shadow">
      <thead className="bg-indigo-100 text-indigo-700">
        <tr>
          <th className="p-2">Unvan</th>
          <th className="p-2">Birim</th>
          <th className="p-2">Bölüm</th>
          <th className="p-2">Son Başvuru</th>
          <th className="p-2">İşlem</th>
        </tr>
      </thead>
      <tbody>
        {ilanlar.map((ilan) => (
          <tr key={ilan.id} className="border-b hover:bg-gray-50">
            <td className="p-2">{ilan.unvan}</td>
            <td className="p-2">{ilan.birim}</td>
            <td className="p-2">{ilan.bolum}</td>
            <td className="p-2">{ilan.tarih}</td>
            <td className="p-2">
              <button
                onClick={() => onBasvur(ilan.id)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Başvur
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
