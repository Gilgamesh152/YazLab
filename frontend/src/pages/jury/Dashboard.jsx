import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function JuryDashboard() {
  const navigate = useNavigate();

  // 🔄 Burada gerçek login verisine göre akademisyenin jüri olup olmadığı kontrol edilir
  const [isJuri] = useState(true); // manuel: true veya false

  const basvurular = [
    {
      id: 1,
      adayAdi: "Ali Yılmaz",
      unvan: "Doçent",
      bolum: "Bilgisayar Mühendisliği",
      tarih: "2025-04-20",
    },
    {
      id: 2,
      adayAdi: "Elif Kaya",
      unvan: "Dr. Öğr. Üyesi",
      bolum: "Elektrik Mühendisliği",
      tarih: "2025-04-18",
    },
  ];

  const handleIncele = (id) => {
    navigate(`/akademisyen/degerlendirme?id=${id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Jüri Paneli</h1>

      {!isJuri ? (
        <p className="text-gray-600">İncelemeniz gereken bir başvuru bulunmamaktadır.</p>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-2 text-indigo-600">
            Atandığınız Başvurular
          </h2>

          <table className="w-full border text-left shadow">
            <thead className="bg-indigo-100 text-indigo-700">
              <tr>
                <th className="p-2">Aday</th>
                <th className="p-2">Unvan</th>
                <th className="p-2">Bölüm</th>
                <th className="p-2">Tarih</th>
                <th className="p-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {basvurular.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{b.adayAdi}</td>
                  <td className="p-2">{b.unvan}</td>
                  <td className="p-2">{b.bolum}</td>
                  <td className="p-2">{b.tarih}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleIncele(b.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      İncele
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
